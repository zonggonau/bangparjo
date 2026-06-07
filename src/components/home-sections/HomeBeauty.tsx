import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { getDescendantCategoryIds } from '@/lib/categories';

const BEAUTY_CJ_CATEGORY_ID = '2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902';

async function getBeautyProducts() {
  try {
    const categoryIds = await getDescendantCategoryIds(BEAUTY_CJ_CATEGORY_ID);
    if (categoryIds.length === 0) return [];

    const dbProducts = await prisma.product.findMany({
      where: { 
        categoryId: { in: categoryIds },
        status: 'ACTIVE' 
      },
      include: { variants: { take: 1 } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return dbProducts.map((p: any) => ({
      pid: p.cjId,
      productName: p.name,
      productNameEn: p.name,
      productImage: p.images?.[0] || '',
      bigImage: p.images?.[0] || '',
      sellPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
      nowPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
      discountPrice: '',
      categoryName: 'Beauty',
      productSku: p.variants?.[0]?.sku || '',
      productWeight: p.variants?.[0]?.weight || 0,
      productUnit: 'piece',
      categoryId: p.categoryId,
      listedNum: 0,
      isFreeShipping: false,
    }));
  } catch (e) {
    console.warn('[HomeBeauty] DB fetch failed:', e);
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
