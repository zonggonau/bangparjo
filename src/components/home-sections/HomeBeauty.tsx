import { getProducts } from '@/lib/cj';
import { prisma } from '@/lib/db';
import { getOrSet } from '@/lib/redis';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

const CACHE_TTL = 3600; // 1 hour

async function getBeautyProducts() {
  return getOrSet('home:beauty', fetchBeautyProducts, CACHE_TTL);
}

async function fetchBeautyProducts() {
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: { 
      OR: [
        { name: { contains: 'Beauty', mode: 'insensitive' } },
        { name: { contains: 'Skin', mode: 'insensitive' } },
        { name: { contains: 'Makeup', mode: 'insensitive' } },
        { name: { contains: 'Hair', mode: 'insensitive' } },
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
    categoryName: "Beauty",
    productSku: "",
    productWeight: 0,
    productUnit: "piece",
    categoryId: "",
  }));

  if (mainProducts.length < 1) {
    try {
      const res = await getProducts({ categoryId: '2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902', pageSize: 10 });
      if (res.success && res.data) {
        const apiProducts = res.data.list;
        const pids = new Set(mainProducts.map(p => p.pid));
        apiProducts.forEach((p: any) => { if (!pids.has(p.pid)) mainProducts.push(p); });
      }
    } catch (e) {
      console.warn('[HomeBeauty] CJ API Fallback failed, using DB only.');
    }
  }

  return mainProducts;
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
            <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#1A1A1A] m-0">Health & <span className="text-[#FF6B00]">Beauty</span></h2>
          </div>
          <Link 
            href="/category/health-beauty-and-hair-2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902" 
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
