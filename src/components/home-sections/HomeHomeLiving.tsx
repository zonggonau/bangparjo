import { prisma } from '@/lib/db';
import ProductCard from '../ProductCard';
import { getProducts } from '@/lib/cj-api';
import Link from 'next/link';

export default async function HomeHomeLiving() {
  // Try to get from local DB first
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: {
      OR: [
        { name: { contains: 'Home', mode: 'insensitive' } },
        { name: { contains: 'Kitchen', mode: 'insensitive' } },
        { name: { contains: 'Household', mode: 'insensitive' } },
        { name: { contains: 'Dining', mode: 'insensitive' } },
      ]
    },
    include: { variants: true },
    orderBy: { createdAt: 'desc' }
  });

  let mainProducts = dbProducts.map(p => ({
    pid: p.cjId,
    productName: p.name,
    productNameEn: p.name,
    productImage: p.images[0],
    bigImage: p.images[0],
    sellPrice: p.variants[0]?.sellingPrice || 0,
    categoryName: "Home & Living",
    productSku: "",
    productWeight: 0,
    productUnit: "piece",
    categoryId: "",
  }));

  // Fallback to CJ API if DB has few products
  if (mainProducts.length < 4) {
    try {
      // Home, Garden & Furniture category ID from CJ
      const res = await getProducts({ categoryId: '9840E81D-F81A-4C2E-83B9-8F2C7D4A0B12', pageSize: 10 });
      if (res.success && res.data) {
        const apiProducts = res.data.list;
        const pids = new Set(mainProducts.map(p => p.pid));
        apiProducts.forEach((p: any) => { if (!pids.has(p.pid)) mainProducts.push(p); });
      }
    } catch (e) {
      console.warn('[HomeHomeLiving] CJ API Fallback failed');
    }
  }

  if (mainProducts.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-home text-[#FF6B00]"></i>
              <span className="text-[12px] font-extrabold text-[#FF6B00] uppercase tracking-[0.1em]">Home Comfort</span>
            </div>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#1A1A1A] m-0">Home & <span className="text-[#FF6B00]">Living</span></h2>
          </div>
          <Link href="/category/home-kitchen" className="inline-flex items-center justify-center gap-2 px-[18px] py-2 rounded-[6px] font-semibold text-[13px] cursor-pointer transition-all duration-300 border-2 border-[#FF6B00] bg-transparent text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white hover:-translate-y-0.5">
            View All <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {mainProducts.slice(0, 10).map((product) => (
            <ProductCard key={product.pid} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
