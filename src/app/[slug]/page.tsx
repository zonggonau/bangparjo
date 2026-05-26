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
    const product = parseProductData(post.content);
    if (product) {
      const settings = await getCachedStoreSettings();

      // Validate coupon status (expired, exhausted, or deactivated) against the database
      if (product.coupon) {
        const dbCoupon = await prisma.coupon.findUnique({
          where: { code: product.coupon.code.toUpperCase() }
        });
        const now = new Date();
        const isExpired = product.coupon.expiresAt ? new Date(product.coupon.expiresAt) <= now : false;
        const isExhausted = dbCoupon && dbCoupon.maxUses !== null ? dbCoupon.usedCount >= dbCoupon.maxUses : false;
        const isActive = dbCoupon ? dbCoupon.isActive : false;

        if (isExpired || isExhausted || !isActive) {
          product.coupon = undefined;
        }
      }

      // If no coupon attached or it was expired, look up the best active coupon dynamically
      if (!product.coupon) {
        const now = new Date();
        const specificCoupon = await prisma.coupon.findFirst({
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } }
            ],
            products: {
              some: {
                productCjId: product.cjId
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        const activeCoupon = specificCoupon || await prisma.coupon.findFirst({
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } }
            ],
            products: {
              none: {}
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        if (activeCoupon) {
          product.coupon = {
            code: activeCoupon.code,
            type: activeCoupon.type as 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING',
            value: activeCoupon.value,
            description: activeCoupon.description || `Use code ${activeCoupon.code} for savings`,
            minPurchase: activeCoupon.minPurchase || undefined,
            expiresAt: activeCoupon.expiresAt?.toISOString() || undefined,
          };
        }
      }

      // Dynamically recalculate prices based on current live margin settings & coupon inflation (PERCENTAGE / FIXED)
      product.variants = product.variants.map(v => {
        const targetPrice = calculateFinalPrice(v.baseCost, settings);
        let finalPrice = targetPrice;
        if (product.coupon) {
          if (product.coupon.type === 'PERCENTAGE') {
            const pct = product.coupon.value;
            if (pct > 0 && pct < 100) {
              // Inflate the price so that when the percentage coupon is subtracted, it returns exactly to targetPrice
              finalPrice = targetPrice / (1 - pct / 100);
            }
          } else if (product.coupon.type === 'FIXED') {
            const amount = product.coupon.value;
            if (amount > 0) {
              // Inflate the price by adding the fixed coupon amount so that after the discount it returns to targetPrice
              finalPrice = targetPrice + amount;
            }
          }
        }
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
      const html = renderProductTemplate(enrichedProduct, waNumber, baseUrl);


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
