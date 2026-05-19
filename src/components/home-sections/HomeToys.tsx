import { getProducts } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default async function HomeToys() {
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: { 
      OR: [
        { name: { contains: 'Toy', mode: 'insensitive' } },
        { name: { contains: 'Game', mode: 'insensitive' } },
        { name: { contains: 'Remote Control', mode: 'insensitive' } },
        { name: { contains: 'Puzzle', mode: 'insensitive' } },
        { name: { contains: 'Drone', mode: 'insensitive' } },
      ]
    },
    include: { variants: true }
  });

  let mainProducts = dbProducts.map(p => ({
    pid: p.cjId,
    productName: p.name,
    productNameEn: p.name,
    productImage: p.images[0],
    bigImage: p.images[0],
    sellPrice: p.variants[0]?.sellingPrice || 0,
    categoryName: "Toys",
    productSku: "",
    productWeight: 0,
    productUnit: "piece",
    categoryId: "",
  }));

  if (mainProducts.length < 1) {
    try {
      const res = await getProducts({ categoryId: 'E698F567-2A7A-4545-98F1-4F23F976D1F6', pageSize: 10 });
      if (res.success && res.data) {
        const apiProducts = res.data.list;
        const pids = new Set(mainProducts.map(p => p.pid));
        apiProducts.forEach((p: any) => { if (!pids.has(p.pid)) mainProducts.push(p); });
      }
    } catch (e) {
      console.warn('[HomeToys] CJ API Fallback failed, using DB only.');
    }
  }

  if (mainProducts.length === 0) return null;

  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-robot text-[#FF6B00]"></i>
              <span className="text-[12px] font-extrabold text-[#FF6B00] uppercase tracking-[0.1em]">Fun & Hobbies</span>
            </div>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#1A1A1A] m-0">Toys & <span className="text-[#FF6B00]">Hobbies</span></h2>
          </div>
          <Link 
            href="/category/toys-kids-and-baby-E698F567-2A7A-4545-98F1-4F23F976D1F6" 
            className="inline-flex items-center justify-center gap-2 px-[18px] py-2 rounded-[6px] font-semibold text-[13px] cursor-pointer transition-all duration-300 border-2 border-[#FF6B00] bg-transparent text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white hover:-translate-y-0.5"
          >
            See All <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {mainProducts.map((product) => (
            <ProductCard key={product.pid} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
