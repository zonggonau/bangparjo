import { getProductsV2 } from '@/lib/cj';
import { getOrSet } from '@/lib/redis';
import { importProductsBatchAction } from '@/lib/actions-catalog';
import ProductCard from '@/components/ProductCard';

const CACHE_TTL = 3600; // 1 jam — supaya data selalu terbaru dari API

async function getBestSellers() {
  return getOrSet('home:bestsellers_v2', fetchBestSellers, CACHE_TTL);
}

async function fetchBestSellers() {
  try {
    // Ambil 10 produk terbaru dari CJ API V2 (primary source)
    const res = await getProductsV2({
      size: 10,
      orderBy: 3,    // sort by create time
      sort: 'desc',  // terbaru dulu
    });

    if (res.success && res.data?.content?.[0]?.productList?.length) {
      const products = res.data.content[0].productList;

      // Background import ke DB lokal (dengan 1 varian sementara)
      importProductsBatchAction(products).catch(err => {
        console.error('[HomeBestSellers] Auto-import error:', err);
      });

      return products.map((p: any) => ({
        pid: p.id,
        productName: p.nameEn,
        productNameEn: p.nameEn,
        productImage: p.bigImage,
        bigImage: p.bigImage,
        sellPrice: parseFloat(p.nowPrice || p.sellPrice || '0'),
        nowPrice: p.nowPrice,
        discountPrice: p.discountPrice,
        categoryName: p.threeCategoryName || p.twoCategoryName || p.oneCategoryName || 'Best Sellers',
        productSku: p.sku,
        productWeight: 0,
        productUnit: 'piece',
        categoryId: p.categoryId,
        listedNum: p.listedNum,
        isFreeShipping: p.addMarkStatus === 1,
      }));
    }
  } catch (e) {
    console.warn('[HomeBestSellers] CJ API V2 failed:', e);
  }

  return [];
}

export default async function HomeBestSellers() {
  const mainProducts = await getBestSellers();

  if (mainProducts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {mainProducts.map((product: any) => (
        <ProductCard key={product.pid} product={product as any} />
      ))}
    </div>
  );
}
