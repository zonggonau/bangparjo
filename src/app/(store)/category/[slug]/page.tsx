import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import SortSelector from '@/components/SortSelector';
import { 
  ChevronRight, 
  Home, 
  Filter, 
  SearchX, 
  ArrowLeft,
  LayoutGrid,
  Zap
} from 'lucide-react';

async function getCategoryBySlug(slug: string) {
  let category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: { take: 20 },
      parent: { include: { parent: true } }
    }
  });

  if (!category) {
    const commonMappings: Record<string, string> = {
      'electronics': 'consumer-electronics',
      'gadgets': 'consumer-electronics',
      'fashion': 'fashion-jewelry',
      'womens-clothing': 'fashion-jewelry', 
      'beauty': 'health-beauty-and-hair',
      'home-kitchen': 'home-garden',
      'home': 'home-garden',
      'all': 'all-categories'
    };

    if (slug === 'all') {
      category = await prisma.category.findFirst({
        where: { parentId: null },
        include: { children: { take: 20 }, parent: true }
      }) as any;
    } else if (commonMappings[slug]) {
      const targetSlugPart = commonMappings[slug];
      const fallbackCat = await prisma.category.findFirst({
        where: { slug: { contains: targetSlugPart, mode: 'insensitive' } }
      });
      
      if (fallbackCat) {
        category = await prisma.category.findUnique({
          where: { id: fallbackCat.id },
          include: {
            children: { take: 20 },
            parent: { include: { parent: true } }
          }
        }) as any;
      }
    }
  }
  return category;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';

  if (!category) return { title: 'Category Not Found' };

  const title = `${category.name} — Shop Global Best Sellers`;
  const description = `Find the best collection of ${category.name} with worldwide shipping. Competitive prices and guaranteed quality at BangParjo Shop.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/category/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/category/${slug}`,
      siteName: 'BangParjo Shop',
      images: [
        {
          url: '/logo-banner.png',
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo-banner.png'],
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; minPrice?: string; maxPrice?: string; sort?: string }>;
}) {
  const { slug } = await params;
  const sParams = await searchParams;
  
  const pageNum = parseInt(sParams.page || '1');
  const minPrice = sParams.minPrice ? parseFloat(sParams.minPrice) : undefined;
  const maxPrice = sParams.maxPrice ? parseFloat(sParams.maxPrice) : undefined;
  const sort = sParams.sort ? parseInt(sParams.sort) : 0; 

  const category = await getCategoryBySlug(slug);

  if (!category) {
    return (
      <div className="min-h-screen bg-[#07070e] flex items-center justify-center pt-32 pb-20">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
            <SearchX size={40} />
          </div>
          <h1 className="text-4xl font-black text-white">Category Not Found</h1>
          <p className="text-gray-500">The collection you are looking for doesn&apos;t exist or has moved.</p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-primary text-black font-black px-8 py-3 rounded-xl transition-all hover:bg-primary-dark"
          >
            <ArrowLeft size={18} /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  const ITEMS_PER_PAGE = 20;

  const dbProducts = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      variants: {
        some: {
          sellingPrice: {
            gte: minPrice,
            lte: maxPrice
          }
        }
      }
    },
    include: { variants: true },
    take: ITEMS_PER_PAGE,
    skip: (pageNum - 1) * ITEMS_PER_PAGE,
    orderBy: sort === '0' ? { createdAt: 'desc' } : { updatedAt: 'desc' },
  });

  const products = dbProducts.map(p => ({
    pid: p.cjId,
    productName: p.name,
    productNameEn: p.name,
    productImage: p.images[0],
    bigImage: p.images[0],
    sellPrice: p.variants[0]?.sellingPrice || 0,
    categoryName: category?.name || 'Product',
  }));

  const total = await prisma.product.count({ 
    where: { 
      categoryId: category.id,
      variants: {
        some: {
          sellingPrice: { gte: minPrice, lte: maxPrice }
        }
      }
    } 
  });

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#07070e] pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-10">
            {/* Breadcrumbs */}
            <nav className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Home size={12} /> Home
              </Link>
              {category.parent?.parent && (
                 <>
                   <ChevronRight size={10} className="text-white/10" />
                   <Link href={`/category/${category.parent.parent.slug}`} className="hover:text-primary transition-colors">
                     {category.parent.parent.name}
                   </Link>
                 </>
              )}
              {category.parent && (
                <>
                   <ChevronRight size={10} className="text-white/10" />
                   <Link href={`/category/${category.parent.slug}`} className="hover:text-primary transition-colors">
                     {category.parent.name}
                   </Link>
                </>
              )}
              <ChevronRight size={10} className="text-white/10" />
              <span className="text-white">{category.name}</span>
            </nav>

            {/* Sub Categories */}
            <div className="space-y-6">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <LayoutGrid size={14} className="text-primary" /> Collections
              </h3>
              {category.children.length > 0 ? (
                <ul className="space-y-3">
                  {category.children.map(child => (
                    <li key={child.id}>
                      <Link 
                        href={`/category/${child.slug}`}
                        className="text-sm text-gray-500 hover:text-primary flex items-center gap-2 transition-colors group"
                      >
                        <span className="w-1 h-1 rounded-full bg-white/10 group-hover:bg-primary transition-colors" />
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : category.parent ? (
                <Link 
                  href={`/category/${category.parent.slug}`} 
                  className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline"
                >
                  <ArrowLeft size={14} /> Back to {category.parent.name}
                </Link>
              ) : <p className="text-sm text-gray-600">No sub-collections</p>}
            </div>

            {/* Price Filter */}
            <div className="space-y-6 p-6 bg-white/5 border border-white/10 rounded-3xl sticky top-32">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <Filter size={14} className="text-primary" /> Price Range
              </h3>
              <form action="" method="get" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Min USD</label>
                    <input 
                      type="number" 
                      name="minPrice" 
                      placeholder="0" 
                      defaultValue={sParams.minPrice} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Max USD</label>
                    <input 
                      type="number" 
                      name="maxPrice" 
                      placeholder="999+" 
                      defaultValue={sParams.maxPrice} 
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <input type="hidden" name="sort" value={sort} />
                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-dark text-black font-black py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/10"
                >
                  Apply Filters
                </button>
              </form>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <Zap size={10} className="text-primary" /> {total.toLocaleString()} Products
                </div>
                <h1 className="font-outfit text-5xl font-black text-white tracking-tight leading-none">
                  {category.name}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-4">Sort By</span>
                <SortSelector currentSort={sort} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-4" />
              </div>
            </header>

            {products.length > 0 ? (
              <div className="space-y-16">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                  {products.map((product) => (
                    <ProductCard key={product.pid} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3">
                    {pageNum > 1 && (
                      <Link 
                        href={{ query: { ...sParams, page: pageNum - 1 } }} 
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-primary hover:text-black transition-all"
                      >
                        <ArrowLeft size={18} />
                      </Link>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let startPage = Math.max(1, pageNum - 2);
                        let endPage = Math.min(totalPages, startPage + 4);
                        if (endPage === totalPages) {
                          startPage = Math.max(1, endPage - 4);
                        }
                        
                        const p = startPage + i;
                        if (p > totalPages) return null;
                        
                        return (
                          <Link
                            key={p}
                            href={{ query: { ...sParams, page: p } }}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black transition-all ${
                              pageNum === p 
                                ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white'
                            }`}
                          >
                            {p}
                          </Link>
                        );
                      })}
                    </div>

                    {pageNum < totalPages && (
                      <Link 
                        href={{ query: { ...sParams, page: pageNum + 1 } }} 
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-primary hover:text-black transition-all"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-32 text-center space-y-6">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-gray-700 mx-auto">
                  <SearchX size={48} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">No products found</h2>
                  <p className="text-gray-500 max-w-sm mx-auto">We couldn&apos;t find any items matching your current filters. Try broadening your search.</p>
                </div>
                <Link 
                  href={`/category/${slug}`} 
                  className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                >
                  Clear All Filters →
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
</div>
  );
}
