import { getProductDetails } from '@/lib/cj-api';
import ProductView from './ProductView';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { Package, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
  } : await (async () => {
    const res = await getProductDetails(id);
    return res.success ? {
      name: res.data.productNameEn || res.data.productName,
      desc: res.data.description,
      image: res.data.productImage || res.data.bigImage
    } : null;
  })();

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



  // 2. Jika tidak ada di DB, tampilkan pesan 'Segera Hadir'
  return (
    <div className="min-h-screen bg-[#07070e] flex items-center justify-center pt-32 pb-20 px-6">
      <div className="max-w-md w-full text-center space-y-8 p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <div className="relative w-full h-full bg-primary/10 rounded-3xl flex items-center justify-center text-primary border border-primary/20">
            <Package size={40} strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black rounded-full border border-white/10 flex items-center justify-center">
            <Loader2 size={20} className="text-primary animate-spin" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">Product Preparing</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Maaf, produk ini baru saja kami pilih dan sedang dalam proses sinkronisasi ke katalog lokal kami. Silakan cek kembali beberapa saat lagi.
          </p>
        </div>

        <Link 
          href="/" 
          className="inline-flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-dark text-black font-black py-4 rounded-2xl transition-all active:scale-95"
        >
          <ArrowLeft size={18} /> Kembali Belanja
        </Link>
      </div>
    </div>
  );
}

