import { getProducts } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';

export default async function HomeBestSellers() {
  const dbProducts = await prisma.product.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { variants: true }
  });

  let mainProducts = dbProducts.map(p => ({
    pid: p.cjId,
    productName: p.name,
    productNameEn: p.name,
    productImage: p.images[0],
    bigImage: p.images[0],
    sellPrice: p.variants[0]?.sellingPrice || 0,
    categoryName: 'Imported',
  }));

  if (mainProducts.length < 1) {
    try {
      const mainRes = await getProducts({ pageSize: 10, productFlag: 0 }); 
      if (mainRes.success && mainRes.data) {
        const apiProducts = mainRes.data.list;
        const pids = new Set(mainProducts.map(p => p.pid));
        apiProducts.forEach((p: any) => {
          if (!pids.has(p.pid)) mainProducts.push(p);
        });
      }
    } catch (e) {
      console.warn('[HomeBestSellers] CJ API Fallback failed, showing empty or DB only.');
    }
  }

  if (mainProducts.length === 0) return null;

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-primary fill-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Hot Demand</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              BEST <span className="text-primary text-glow">SELLERS</span>
            </h2>
          </div>
          <Link 
            href="/?q=trending" 
            className="group flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Explore Hotlist <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {mainProducts.map((product, index) => (
            <ProductCard key={product.pid} product={product} priority={index < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}

