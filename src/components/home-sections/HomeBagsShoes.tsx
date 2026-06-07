import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { getDescendantCategoryIds } from '@/lib/categories';

const BAGS_SHOES_CJ_CATEGORY_ID = '2415A90C-5D7B-4CC7-BA8C-C0949F9FF5D8';

async function getBagsShoesProducts() {
  try {
    const categoryIds = await getDescendantCategoryIds(BAGS_SHOES_CJ_CATEGORY_ID);
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
      categoryName: 'Bags & Shoes',
      productSku: p.variants?.[0]?.sku || '',
      productWeight: p.variants?.[0]?.weight || 0,
      productUnit: 'piece',
      categoryId: p.categoryId,
      listedNum: 0,
      isFreeShipping: false,
    }));
  } catch (e) {
    console.warn('[HomeBagsShoes] DB fetch failed:', e);
  }

  return [];
}

export default async function HomeBagsShoes() {
  const mainProducts = await getBagsShoesProducts();

  if (mainProducts.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-shoe-prints text-[#FF6B00]"></i>
              <span className="text-[12px] font-extrabold text-[#FF6B00] uppercase tracking-[0.1em]">Step in Style</span>
            </div>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#1A1A1A] m-0">Bags &amp; <span className="text-[#FF6B00]">Shoes</span></h2>
          </div>
          <Link 
            href="/category/bags-and-shoes-2415A90C-5D7B-4CC7-BA8C-C0949F9FF5D8" 
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
