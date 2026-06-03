import { getProductsV2 } from '@/lib/cj';
import { getOrSet } from '@/lib/redis';
import { importProductsBatchAction } from '@/lib/actions-catalog';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

const CACHE_TTL = 3600; // 1 jam

// CJ Category ID: Toys, Kids & Babies
const TOYS_CATEGORY_ID = 'E698F567-2A7A-4545-98F1-4F23F976D1F6';

async function getToysProducts() {
  return getOrSet('home:toys_v2', fetchToysProducts, CACHE_TTL);
}

async function fetchToysProducts() {
  try {
    const res = await getProductsV2({
      size: 10,
      categoryId: TOYS_CATEGORY_ID,
      orderBy: 3,   // sort by create time
      sort: 'desc', // terbaru dulu
    });

    if (res.success && res.data?.content?.[0]?.productList?.length) {
      const products = res.data.content[0].productList;

      // Background import ke DB lokal
      importProductsBatchAction(products).catch(err => {
        console.error('[HomeToys] Auto-import error:', err);
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
        categoryName: p.threeCategoryName || p.twoCategoryName || 'Toys',
        productSku: p.sku,
        productWeight: 0,
        productUnit: 'piece',
        categoryId: p.categoryId,
        listedNum: p.listedNum,
        isFreeShipping: p.addMarkStatus === 1,
      }));
    }
  } catch (e) {
    console.warn('[HomeToys] CJ API V2 failed:', e);
  }

  return [];
}

export default async function HomeToys() {
  const mainProducts = await getToysProducts();
  const filteredProducts = mainProducts.filter((product: any) => product.pid);

  if (filteredProducts.length === 0) return null;

  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-robot text-[#FF6B00]"></i>
              <span className="text-[12px] font-extrabold text-[#FF6B00] uppercase tracking-[0.1em]">Fun &amp; Hobbies</span>
            </div>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#1A1A1A] m-0">Toys &amp; <span className="text-[#FF6B00]">Hobbies</span></h2>
          </div>
          <Link 
            href="/category/toys-kids-and-baby-E698F567-2A7A-4545-98F1-4F23F976D1F6" 
            className="inline-flex items-center justify-center gap-2 px-[18px] py-2 rounded-[6px] font-semibold text-[13px] cursor-pointer transition-all duration-300 border-2 border-[#FF6B00] bg-transparent text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white hover:-translate-y-0.5"
          >
            See All <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredProducts.map((product: any) => (
            <ProductCard key={product.pid} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
