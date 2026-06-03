import { getProductsV2 } from '@/lib/cj';
import { getOrSet } from '@/lib/redis';
import { importProductsBatchAction } from '@/lib/actions-catalog';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

const CACHE_TTL = 3600; // 1 jam

// CJ Category ID: Health, Beauty & Hair
const BEAUTY_CATEGORY_ID = '2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902';

async function getBeautyProducts() {
  return getOrSet('home:beauty_v2', fetchBeautyProducts, CACHE_TTL);
}

async function fetchBeautyProducts() {
  try {
    const res = await getProductsV2({
      size: 10,
      categoryId: BEAUTY_CATEGORY_ID,
      orderBy: 3,   // sort by create time
      sort: 'desc', // terbaru dulu
    });

    if (res.success && res.data?.content?.[0]?.productList?.length) {
      const products = res.data.content[0].productList;

      // Background import ke DB lokal
      importProductsBatchAction(products).catch(err => {
        console.error('[HomeBeauty] Auto-import error:', err);
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
        categoryName: p.threeCategoryName || p.twoCategoryName || 'Beauty',
        productSku: p.sku,
        productWeight: 0,
        productUnit: 'piece',
        categoryId: p.categoryId,
        listedNum: p.listedNum,
        isFreeShipping: p.addMarkStatus === 1,
      }));
    }
  } catch (e) {
    console.warn('[HomeBeauty] CJ API V2 failed:', e);
  }

  return [];
}

export default async function HomeBeauty() {
  const mainProducts = await getBeautyProducts();

  if (mainProducts.length === 0) return null;

  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-sparkles text-[#FF6B00]"></i>
              <span className="text-[12px] font-extrabold text-[#FF6B00] uppercase tracking-[0.1em]">Premium Glow</span>
            </div>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#1A1A1A] m-0">Health &amp; <span className="text-[#FF6B00]">Beauty</span></h2>
          </div>
          <Link 
            href="/category/health-beauty-and-hair-2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902" 
            className="inline-flex items-center justify-center gap-2 px-[18px] py-2 rounded-[6px] font-semibold text-[13px] cursor-pointer transition-all duration-300 border-2 border-[#FF6B00] bg-transparent text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white hover:-translate-y-0.5"
          >
            See All <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {mainProducts.map((product: any) => (
            <ProductCard key={product.pid} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
