/**
 * Blog Post Detail — Full-page render
 *
 * Route: /[slug]
 *
 * The blog `content` field can be either:
 * 1. Raw HTML — rendered as-is (for marketing pages, custom landing pages)
 * 2. JSON with `type: "product"` — rendered using the professional product template
 *
 * No store layout (Navbar/Footer) — full page from top to bottom.
 */

import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { isProductData, parseProductData, renderProductTemplate } from '@/lib/blog-templates';
import { getOrSet } from '@/lib/redis';
import { getCachedStoreSettings } from '@/lib/server-settings';
import { calculateFinalPrice } from '@/lib/pricing';
import { getProductDetails } from '@/lib/cj-api';


interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    select: { title: true, excerpt: true, image: true, content: true },
  });

  if (!post) return {};

  // If it's product JSON data, use AI-generated metadata if available
  if (isProductData(post.content)) {
    const product = parseProductData(post.content);
    if (product) {
      const aiContent = (product as any).ai || {};
      const seoTitle = aiContent.seoTitle || `${product.name} — BangParjo`;
      const seoDescription = aiContent.seoDescription || `Buy ${product.name} at the best price. Premium quality, global shipping, and satisfaction guaranteed.`;
      return {
        title: seoTitle,
        description: seoDescription,
        openGraph: {
          title: seoTitle,
          description: seoDescription,
          images: product.images[0] ? [{ url: product.images[0], width: 1200, height: 630 }] : [],
        },
        twitter: {
          card: 'summary_large_image',
          title: seoTitle,
          description: seoDescription,
          images: product.images[0] ? [product.images[0]] : [],
        },
      };
    }
  }

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: post.image ? { images: [post.image] } : undefined,
  };
}

export default async function BlogSlugPage(props: Props) {
  const { slug } = await props.params;

  const cacheKey = 'blog:post:' + slug;

  const post = await getOrSet(
    cacheKey,
    async () => {
      const p = await prisma.blogPost.findUnique({
        where: { slug, published: true },
      });
      if (!p) return null;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        image: p.image,
        author: p.author,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    },
    300, // 5 minutes
  );

  if (!post) {
    notFound();
  }

  // Detect if content is JSON product data and render with template
  if (isProductData(post.content)) {
    let product = parseProductData(post.content);
    if (product) {
      const settings = await getCachedStoreSettings();

      // AUTO-SYNC: If variants are missing or minimal, fetch full details from CJ
      // This happens while the skeleton is shown (thanks to loading.tsx)
      if (!product.variants || product.variants.length === 0 || product.variants.length === 1 && product.variants[0].sku.includes('default')) {
        try {
          const cjRes = await getProductDetails(product.cjId);
          if (cjRes.success && cjRes.data) {
            const cjProd = cjRes.data;
            
            // Map CJ variants to our internal ProductVariantData format
            const enrichedVariants = cjProd.variants.map(v => {
              const baseCost = Number(v.variantSellPrice) || 0;
              return {
                id: v.vid,
                cjId: v.vid,
                sku: v.variantSku,
                color: v.variantKey || v.variantNameEn || v.variantName || null,
                size: null, // CJ usually combines color/size in variantKey
                weight: v.variantWeight || 0,
                baseCost: baseCost,
                sellingPrice: calculateFinalPrice(baseCost, settings),
                inventory: v.inventory || 100,
                image: v.variantImage || cjProd.productImage || null,
              };
            });

            product = {
              ...product,
              description: product.description || cjProd.description || '',
              images: product.images.length > 0 ? product.images : (cjProd.productImageSet || [cjProd.productImage || '']),
              variants: enrichedVariants,
            };

            // Save back to DB to avoid future syncs
            await prisma.blogPost.update({
              where: { id: post.id },
              data: { content: JSON.stringify(product) }
            });

            // Update cache
            const { redis } = await import('@/lib/redis');
            if (redis) {
              await redis.set(cacheKey, JSON.stringify({
                ...post,
                content: JSON.stringify(product),
                updatedAt: new Date().toISOString()
              }), 'EX', 300);
            }
          }
        } catch (err) {
          console.error('[Product Auto-Sync Error]:', err);
        }
      }


      // Calculate prices based on current live margin settings
      product.variants = product.variants.map(v => {
        const finalPrice = calculateFinalPrice(v.baseCost, settings);
        return {
          ...v,
          sellingPrice: finalPrice
        };
      });


      // Fetch other blog posts for recommendations (cached separately)
      const recCacheKey = 'blog:recs:' + slug;
      const recommendations = await getOrSet(
        recCacheKey,
        async () => {
          const recs = await prisma.blogPost.findMany({
            where: {
              published: true,
              slug: { not: slug },
              content: { contains: '"type":"product"' },
            },
            select: {
              title: true,
              slug: true,
              image: true,
              content: true,
            },
            take: 4,
            orderBy: { createdAt: 'desc' },
          });
          return recs.map(r => ({
            title: r.title,
            slug: r.slug,
            image: r.image,
            content: r.content,
          }));
        },
        300, // 5 minutes
      );

      // Parse recommendation data
      const recs = recommendations
        .map(r => {
          const p = parseProductData(r.content);
          if (!p) return null;
          const minP = Math.min(...p.variants.map(v => calculateFinalPrice(v.baseCost, settings)));
          const maxP = Math.max(...p.variants.map(v => calculateFinalPrice(v.baseCost, settings)));
          const price = minP === maxP ? `$${minP.toFixed(2)}` : `$${minP.toFixed(2)} – $${maxP.toFixed(2)}`;
          return {
            title: r.title,
            slug: r.slug,
            image: r.image,
            price,
          };
        })
        .filter(Boolean) as Array<{ title: string; slug: string; image: string | null; price: string }>;

      // Attach recommendations to product data
      const enrichedProduct = { ...product, recommendations: recs };
      const waNumber = process.env.NEXT_PUBLIC_WHATSAPP || '628219105980';
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
      const html = renderProductTemplate(enrichedProduct, waNumber, baseUrl, settings.markupPct);


      return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />;
    }
  }

  // Default: render raw HTML
  return (
    <div
      dangerouslySetInnerHTML={{ __html: post.content }}
      suppressHydrationWarning
    />
  );
}
