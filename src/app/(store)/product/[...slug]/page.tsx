import ProductView from './ProductView';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ id: string, slug?: string[] }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.slug?.[0] || resolvedParams.id;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
  
  // Try local DB first
  const localProduct = await prisma.product.findUnique({
    where: { cjId: id }
  });

  const p = localProduct ? {
    name: localProduct.name,
    desc: localProduct.description,
    image: localProduct.images[0]
  } : null;

  if (!p) return { title: 'Product Not Found' };

  const cleanDesc = p.desc?.substring(0, 160).replace(/<[^>]*>?/gm, '') || 'Shop the best products at bangparjo.shop';

  return {
    title: `${p.name} | BangParjo Shop`,
    description: cleanDesc,
    alternates: {
      canonical: `${baseUrl}/product/${id}`,
    },
    openGraph: {
      title: p.name,
      description: cleanDesc,
      url: `${baseUrl}/product/${id}`,
      siteName: 'BangParjo Shop',
      images: [
        {
          url: p.image || '',
          width: 800,
          height: 800,
          alt: p.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: p.name,
      description: cleanDesc,
      images: [p.image || ''],
    },
  };
}

// Komponen untuk JSON-LD (Struktur Data Google)
function ProductSchema({ product }: { product: any }) {
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.productNameEn || product.productName,
    "image": [product.productImage, ...(product.productImageSet || [])],
    "description": product.description?.replace(/<[^>]*>?/gm, ''),
    "sku": product.pid,
    "brand": {
      "@type": "Brand",
      "name": "BangParjo Shop"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://bangparjo.shop/product/${product.pid}`,
      "priceCurrency": "USD",
      "price": product.variants?.[0]?.variantSellPrice || 0,
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

export default async function Page({ params }: { params: Promise<{ id: string, slug?: string[] }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.slug?.[0] || resolvedParams.id;
  
  // 1. Try fetching from Local DB first
  const localProduct = await prisma.product.findUnique({
    where: { cjId: id },
    include: {
      variants: true,
      category: true
    }
  });

  if (localProduct) {
    // Map local DB format back to CJ format for the ProductView component
    const mappedData = {
      pid: localProduct.cjId,
      productName: localProduct.name,
      productNameEn: localProduct.name,
      description: localProduct.description,
      productImage: localProduct.images[0],
      bigImage: localProduct.images[0],
      productImageSet: localProduct.images,
      categoryName: localProduct.category?.name || 'Uncategorized',
      categoryId: localProduct.category?.id || null,
      variants: localProduct.variants.map(v => ({
        vid: v.cjId,
        variantNameEn: v.color && v.size ? `${v.color} / ${v.size}` : v.color || v.size || 'Default',
        variantSellPrice: v.sellingPrice,
        variantSku: v.sku,
        variantWeight: v.weight,
        inventory: v.inventory,
        variantImage: v.image
      }))
    };

    return (
      <>
        <ProductSchema product={mappedData} />
        <ProductView 
          id={id} 
          initialData={mappedData}
          initialError={null}
        />
      </>
    );
  }

  // 2. No fallback to CJ API — only serve imported products
  return (
    <ProductView 
      id={id} 
      initialData={null}
      initialError="Produk belum diimpor ke database. Hubungi admin untuk informasi lebih lanjut."
    />
  );
}
