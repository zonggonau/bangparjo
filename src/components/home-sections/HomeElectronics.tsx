import { getProducts } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Smartphone, ArrowRight } from 'lucide-react';

export default async function HomeElectronics() {
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: { 
      OR: [
        { name: { contains: 'Phone', mode: 'insensitive' } },
        { name: { contains: 'Watch', mode: 'insensitive' } },
        { name: { contains: 'Earphone', mode: 'insensitive' } },
        { name: { contains: 'Camera', mode: 'insensitive' } },
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
    categoryName: "Electronics",
    productSku: "",
    productWeight: 0,
    productUnit: "piece",
    categoryId: "",
  }));

  if (mainProducts.length < 1) {
    try {
      const res = await getProducts({ categoryId: 'D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2', pageSize: 10 });
      if (res.success && res.data) {
        const apiProducts = res.data.list;
        const pids = new Set(mainProducts.map(p => p.pid));
        apiProducts.forEach((p: any) => { if (!pids.has(p.pid)) mainProducts.push(p); });
      }
    } catch (e) {
      console.warn('[HomeElectronics] CJ API Fallback failed, using DB only.');
    }
  }

  if (mainProducts.length === 0) return null;

  return (
    <section className="py-20 relative overflow-hidden bg-white/2">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone size={16} className="text-accent-light" />
              <span className="text-[10px] font-black text-accent-light uppercase tracking-[0.2em]">Next-Gen Tech</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              SMART <span className="text-accent-light text-glow">GADGETS</span>
            </h2>
          </div>
          <Link 
            href="/category/consumer-electronics-D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2" 
            className="group flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Shop All Tech <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {mainProducts.map((product) => (
            <ProductCard key={product.pid} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

