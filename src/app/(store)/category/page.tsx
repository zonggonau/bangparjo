import { prisma } from '@/lib/db';
import Link from 'next/link';
import { ChevronRight, LayoutGrid } from 'lucide-react';

export const metadata = {
  title: 'All Categories | bangparjo.shop',
  description: 'Browse all product categories on bangparjo.shop',
};

export default async function AllCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="min-h-screen bg-[#07070e] pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <LayoutGrid size={12} /> Explore Everything
          </div>
          <h1 className="font-outfit text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-4">
            Browse All<br />
            <span className="bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent italic">Categories</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            From fashion to electronics, find exactly what you&apos;re looking for across our curated global catalog.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categories.map((cat) => (
            <div key={cat.id} className="group p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 transition-all duration-500">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between group-hover:text-primary transition-colors">
                <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                <ChevronRight size={18} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h2>
              {cat.children && cat.children.length > 0 && (
                <ul className="space-y-3">
                  {cat.children.map((sub) => (
                    <li key={sub.id}>
                      <Link 
                        href={`/category/${sub.slug}`}
                        className="text-sm text-gray-500 hover:text-white flex items-center gap-2 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-primary/50 transition-colors" />
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

