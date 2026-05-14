import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ChevronRight } from 'lucide-react';

const ICON_MAP: Record<string, string> = {
  'Consumer Electronics': '📱',
  'Computer & Office': '💻',
  'Home Improvement': '🏠',
  'Automobiles & Motorcycles': '🚗',
  'Jewelry': '💍',
  'Beauty': '💄',
  'Home & Garden': '🏡',
  'Kitchen': '🍳',
  'Toys & Kids': '🧸',
  'Sports': '⚽',
};

export default async function CategoryBanner() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    take: 12,
  });

  if (categories.length === 0) return null;

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full -z-10" />
      
      <div className="container px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Discover</h2>
            <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
              SHOP BY <span className="text-primary">CATEGORY</span>
            </h3>
          </div>
          <Link href="/categories" className="group flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">
            View All Categories <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative bg-white/5 border border-white/5 hover:border-primary/30 rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden"
            >
              {/* Card Accent */}
              <div 
                className="absolute top-0 right-0 w-24 h-24 blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500" 
                style={{ backgroundColor: `hsl(${index * 30}, 70%, 50%)` }}
              />
              
              <div className="relative z-10 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  {ICON_MAP[cat.name] || '📦'}
                </div>
                <div>
                  <span className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1 group-hover:text-primary/50 transition-colors">Explore</span>
                  <span className="block text-xs font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-1">{cat.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

