import { getProducts } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { Shirt, ArrowRight } from 'lucide-react';

export default async function HomeFashion() {
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: { 
      OR: [
        { name: { contains: 'Bag', mode: 'insensitive' } },
        { name: { contains: 'Shoes', mode: 'insensitive' } },
        { name: { contains: 'Clothing', mode: 'insensitive' } },
        { name: { contains: 'Watch', mode: 'insensitive' } },
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
    categoryName: 'Fashion',
  }));

  if (mainProducts.length < 1) {
    try {
      const res = await getProducts({ categoryId: 'A8B2857F-622E-4464-98F1-4F23F976D1F6', pageSize: 10 });
      if (res.success && res.data) {
        const apiProducts = res.data.list;
        const pids = new Set(mainProducts.map(p => p.pid));
        apiProducts.forEach((p: any) => { if (!pids.has(p.pid)) mainProducts.push(p); });
      }
    } catch (e) {
      console.warn('[HomeFashion] CJ API Fallback failed, using DB only.');
    }
  }

  if (mainProducts.length === 0) return null;

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <Shirt size={16} className="text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Curated Collection</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              TRENDING <span className="text-primary text-glow">FAHSION</span>
            </h2>
          </div>
          <Link 
            href="/category/fashion-jewelry-123ACC01-7A11-4FB9-A532-338C0E7C04C5" 
            className="group flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Explore Collection <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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

