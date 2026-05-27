import ProductView from './ProductView';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj-api';
import { Suspense } from 'react';
import { ProductDetailSkeleton } from '@/components/ProductSkeleton';

export async function generateMetadata({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string, slug?: string[] }>,
  searchParams: Promise<{ v?: string, color?: string, variant?: string }>
}): Promise<Metadata> {
  const resolvedParams = await params;
  const sParams = await searchParams;
  const id = resolvedParams.slug?.[0] || resolvedParams.id;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
  
  const targetVid = sParams.v || sParams.variant || sParams.color;

  // 1. Try local DB first
  const localProduct = await prisma.product.findUnique({
    where: { cjId: id },
    include: { variants: true }
  });

  let p: any = null;
  let selectedVariant: any = null;

  if (localProduct) {
    p = {
      name: localProduct.name,
      desc: localProduct.description,
      image: localProduct.images[0]
    };
    if (targetVid) {
      selectedVariant = localProduct.variants.find(v => v.cjId === targetVid || v.color === targetVid);
    }
  } else {
    // 2. Try CJ API fallback
    try {
      const cjRes = await getProductDetails(id);
      if (cjRes.success && cjRes.data) {
        p = {
          name: cjRes.data.productNameEn || cjRes.data.productName,
          desc: cjRes.data.description,
          image: cjRes.data.bigImage || cjRes.data.productImage
        };
        if (targetVid) {
          selectedVariant = (cjRes.data.variants || []).find((v: any) => v.vid === targetVid || v.variantKey === targetVid);
        }
      }
    } catch (err) {
      console.error('[generateMetadata] CJ API rate limit or fetch error:', err);
    }
  }

  if (!p) return { title: 'Product Not Found' };

  // Update image and title if variant is selected
  const displayImage = selectedVariant?.image || selectedVariant?.variantImage || p.image;
  const displayTitle = selectedVariant 
    ? `${p.name} (${selectedVariant.color || selectedVariant.variantNameEn || selectedVariant.variantKey}) | BangParjo Shop`
    : `${p.name} | BangParjo Shop`;

  const cleanDesc = p.desc?.substring(0, 160).replace(/<[^>]*>?/gm, '') || 'Shop the best products at bangparjo.shop';

  return {
    title: displayTitle,
    description: cleanDesc,
    alternates: {
      canonical: `${baseUrl}/product/${id}${targetVid ? `?v=${targetVid}` : ''}`,
    },
    openGraph: {
      title: displayTitle,
      description: cleanDesc,
      url: `${baseUrl}/product/${id}`,
      siteName: 'BangParjo Shop',
      images: [
        {
          url: displayImage || '',
          width: 800,
          height: 800,
          alt: p.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: cleanDesc,
      images: [displayImage || ''],
    },
  };
}

// Komponen untuk JSON-LD (Struktur Data Google)
function ProductSchema({ product, selectedVariant }: { product: any, selectedVariant?: any }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
  const displayImage = selectedVariant?.image || selectedVariant?.variantImage || product.productImage;
  const displayPrice = selectedVariant?.variantSellPrice || product.variants?.[0]?.variantSellPrice || 0;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.productNameEn || product.productName,
    "image": [displayImage, ...(product.productImageSet || [])],
    "description": product.description?.replace(/<[^>]*>?/gm, ''),
    "sku": product.pid,
    "brand": {
      "@type": "Brand",
      "name": "BangParjo Shop"
    },
    "offers": {
      "@type": "Offer",
      "url": `${baseUrl}/product/${product.pid}${selectedVariant ? `?v=${selectedVariant.vid || selectedVariant.cjId}` : ''}`,
      "priceCurrency": "USD",
      "price": displayPrice,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function Page({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string, slug?: string[] }>,
  searchParams: Promise<{ v?: string, color?: string, variant?: string }>
}) {
  const resolvedParams = await params;
  const sParams = await searchParams;
  const id = resolvedParams.slug?.[0] || resolvedParams.id;
  const targetVid = sParams.v || sParams.variant || sParams.color;
  
  // 1. Try fetching from Local DB first
  const localProduct = await prisma.product.findUnique({
    where: { cjId: id },
    include: {
      variants: true,
      category: true
    }
  });

  if (localProduct) {
    const mappedData = {
      pid: localProduct.cjId,
      productName: localProduct.name,
      productNameEn: localProduct.name,
      description: localProduct.description || '',
      productImage: localProduct.images[0],
      bigImage: localProduct.images[0],
      productImageSet: localProduct.images,
      categoryName: localProduct.category?.name || 'Uncategorized',
      categoryId: localProduct.category?.id || null,
      variants: localProduct.variants.map(v => ({
        vid: v.cjId,
        variantNameEn: v.color && v.size ? `${v.color} / ${v.size}` : v.color || v.size || 'Default',
        variantKey: v.color || 'Default',
        variantSellPrice: v.sellingPrice,
        variantSku: v.sku,
        variantWeight: v.weight,
        inventory: v.inventory,
        variantImage: v.image
      }))
    };

    const selectedVariant = mappedData.variants.find(v => v.vid === targetVid || v.variantKey === targetVid);

    return (
      <>
        <ProductSchema product={mappedData} selectedVariant={selectedVariant} />
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductView 
            id={id} 
            initialData={mappedData}
            initialError={null}
            selectedVid={targetVid}
          />
        </Suspense>
      </>
    );
  }

  // 2. Fallback to CJ API
  try {
    const cjRes = await getProductDetails(id);
    if (cjRes.success && cjRes.data) {
      const product = cjRes.data;
      
      // Parse productImageSet safely (raw array, comma-separated string, or stringified JSON array)
      const safeImageSet = (() => {
        const raw = product.productImageSet as any;
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
          if (raw.startsWith('[') && raw.endsWith(']')) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) return parsed;
            } catch {}
          }
          return raw.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        return [];
      })();

      const mappedData = {
        pid: product.pid,
        productName: product.productNameEn || product.productName,
        productNameEn: product.productNameEn || product.productName,
        description: product.description || '',
        productImage: product.productImage || product.bigImage,
        bigImage: product.bigImage || product.productImage,
        productImageSet: safeImageSet,
        categoryName: product.categoryName || 'Imported',
        categoryId: product.categoryId,
        variants: (product.variants || []).map((v: any) => ({
          ...v,
          vid: v.vid,
          variantNameEn: v.variantNameEn || v.variantKey || 'Default',
          variantKey: v.variantKey || 'Default',
          variantSellPrice: v.variantSellPrice,
          variantSku: v.variantSku,
          variantWeight: v.variantWeight,
          inventory: v.inventory || v.variantNum || v.variantInventory || 9999,
          variantImage: v.variantImage
        }))
      };

      const selectedVariant = mappedData.variants.find(v => v.vid === targetVid || v.variantKey === targetVid);

      return (
        <>
          <ProductSchema product={mappedData} selectedVariant={selectedVariant} />
          <Suspense fallback={<ProductDetailSkeleton />}>
            <ProductView 
              id={id} 
              initialData={mappedData}
              initialError={null}
              selectedVid={targetVid}
            />
          </Suspense>
        </>
      );
    }
  } catch (err: any) {
    console.error('[Page] Failed to fetch product from CJ due to QPS limits:', err);
    return (
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductView 
          id={id} 
          initialData={null}
          initialError={err?.message || "Failed to load product from CJ Dropshipping due to rate limits. Please try again in a few seconds."}
          selectedVid={targetVid}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductView 
        id={id} 
        initialData={null}
        initialError="Product not found on CJ Dropshipping."
        selectedVid={targetVid}
      />
    </Suspense>
  );
}
