import { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import FilterSortBar from './FilterSortBar';
import { getCategoryBySlug as getCategoryBySlugLib, getCategoryHierarchy } from '@/lib/categories';
import { prisma } from '@/lib/db';

async function getCategoryBySlug(slug: string) {
  const category = await getCategoryBySlugLib(slug);
  if (!category) return null;

  const hierarchy = await getCategoryHierarchy(category.id);
  
  return {
    ...category,
    parent: hierarchy.length > 1 ? hierarchy[hierarchy.length - 2] : null,
    grandparent: hierarchy.length > 2 ? hierarchy[hierarchy.length - 3] : null
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';

  // Helper: fetch first product image from a category (or all products)
  async function getFirstProductImage(categoryIds?: string[]) {
    try {
      const whereClause: any = { status: 'ACTIVE' };
      if (categoryIds) whereClause.categoryId = { in: categoryIds };
      const firstProduct = await prisma.product.findFirst({
        where: whereClause,
        select: { images: true },
        orderBy: { updatedAt: 'desc' },
      });
      return firstProduct?.images?.[0] || null;
    } catch { return null; }
  }

  if (slug === 'all') {
    const ogImage = await getFirstProductImage() || '/logo-banner.png';
    return {
      title: 'All Products — BangParjo Shop',
      description: 'Browse all products with worldwide shipping.',
      alternates: { canonical: `${baseUrl}/category/all` },
      openGraph: {
        title: 'All Products — BangParjo Shop',
        description: 'Browse all products with worldwide shipping.',
        url: `${baseUrl}/category/all`,
        siteName: 'BangParjo Shop',
        images: [{ url: ogImage, width: 1200, height: 630 }],
        type: 'website',
      },
      twitter: { card: 'summary_large_image', title: 'All Products — BangParjo Shop', description: 'Browse all products with worldwide shipping.', images: [ogImage] },
    };
  }

  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };

  // Collect all child category IDs for image lookup
  const catIds = [category.id];
  for (const l2 of category.children) {
    catIds.push(l2.id);
    for (const l3 of l2.children) {
      catIds.push(l3.id);
    }
  }
  const ogImage = await getFirstProductImage(catIds) || '/logo-banner.png';

  const title = `${category.name} — Shop Global Best Sellers`;
  const description = `Find the best collection of ${category.name} with worldwide shipping. Competitive prices and guaranteed quality at BangParjo Shop.`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/category/${slug}` },
    openGraph: {
      title, description,
      url: `${baseUrl}/category/${slug}`,
      siteName: 'BangParjo Shop',
      images: [{ url: ogImage, width: 1200, height: 630, alt: category.name }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; minPrice?: string; maxPrice?: string; sort?: string; freeShipping?: string; keyword?: string }>;
}) {
  const { slug } = await params;
  const sParams = await searchParams;
  
  const pageNum = parseInt(sParams.page || '1');
  const minPrice = sParams.minPrice ? parseFloat(sParams.minPrice) : undefined;
  const maxPrice = sParams.maxPrice ? parseFloat(sParams.maxPrice) : undefined;
  const sortParam = sParams.sort || 'default';
  const freeShipping = sParams.freeShipping === '1' ? 1 : undefined;
  const keyword = sParams.keyword || '';
  
  let orderByField: 'updatedAt' | 'createdAt' | 'name' = 'updatedAt';
  let sortDir: 'desc' | 'asc' = 'desc';

  switch (sortParam) {
    case 'newest': orderByField = 'createdAt'; sortDir = 'desc'; break;
    case 'oldest': orderByField = 'createdAt'; sortDir = 'asc'; break;
    case 'price-desc': orderByField = 'name'; sortDir = 'desc'; break;
    case 'price-asc': orderByField = 'name'; sortDir = 'asc'; break;
    default: orderByField = 'updatedAt'; sortDir = 'desc'; break;
  }

  // ── SLUG 'all' → tampilkan semua produk ──
  if (slug === 'all') {
    const PAGE_SIZE = 100;
    let products: any[] = [];
    let total = 0;

    try {
      const whereClause: any = { status: 'ACTIVE' };
      if (keyword) whereClause.name = { contains: keyword, mode: 'insensitive' };

      const [dbProducts, dbTotal] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          include: { variants: { take: 1 } },
          orderBy: { [orderByField]: sortDir },
          skip: (pageNum - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.product.count({ where: whereClause }),
      ]);

      total = dbTotal;
      products = dbProducts.map(p => ({
        pid: p.cjId,
        productNameEn: p.name,
        productImage: p.images?.[0] || '',
        bigImage: p.images?.[0] || '',
        sellPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
      }));
    } catch (error) {
      console.warn('[CategoryPage/All] DB query failed:', error);
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
      <div className="bg-gray-50 min-h-screen py-10 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5">
          <nav className="flex items-center gap-1.5 text-[11px] font-bold uppercase mb-6 text-gray-400">
            <Link href="/" className="text-inherit no-underline hover:text-[#FF6B00]">Home</Link>
            <i className="fas fa-chevron-right text-[8px] opacity-40"></i>
            <span className="text-[#FF6B00]">All Products</span>
          </nav>

          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1A1A]">All Products</h1>
                <p className="text-gray-500 font-semibold text-sm sm:text-base">{total.toLocaleString()} products available</p>
              </div>
              <FilterSortBar slug="all" />
            </div>
          </header>

          {products.length > 0 ? (
            <>
              <div className="grid gap-3 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {products.map((product: any) => (
                  <ProductCard key={product.pid} product={product} />
                ))}
              </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 sm:gap-4 mt-10 sm:mt-14">
                  {pageNum > 1 && (
                    <Link href={{ query: { ...sParams, page: pageNum - 1 } }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold border border-gray-200 text-sm no-underline hover:bg-gray-50 text-[#1A1A1A]">
                      <i className="fas fa-chevron-left text-[10px]"></i> Prev
                    </Link>
                  )}
                  <div className="flex gap-1.5 sm:gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let startPage = Math.max(1, pageNum - 2);
                      const endPage = Math.min(totalPages, startPage + 4);
                      if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
                      const p = startPage + i;
                      if (p > totalPages) return null;
                      return (
                        <Link key={p} href={{ query: { ...sParams, page: p } }}
                          className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-md font-semibold no-underline text-sm ${pageNum === p ? 'bg-[#FF6B00] text-white' : 'border border-gray-200 text-[#1A1A1A] hover:bg-gray-50'}`}
                        >{p}</Link>
                      );
                    })}
                  </div>
                  {pageNum < totalPages && (
                    <Link href={{ query: { ...sParams, page: pageNum + 1 } }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold border border-gray-200 text-sm no-underline hover:bg-gray-50 text-[#1A1A1A]">
                      Next <i className="fas fa-chevron-right text-[10px]"></i>
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-10 sm:p-16 text-center border border-gray-200">
              <i className="fas fa-inbox text-4xl text-gray-300 mb-4 block"></i>
              <h2 className="text-xl font-black mb-2 text-[#1A1A1A]">No products yet</h2>
              <p className="text-gray-500 text-sm">Products will appear here once imported via webhook or dashboard.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Kategori biasa ──
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Category Not Found</h1>
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline">Return Home</Link>
      </div>
    );
  }

  const PAGE_SIZE = 100;
  let products: any[] = [];
  let total = 0;

  try {
    const catIdsToSearch = [category.id];
    for (const l2 of category.children) {
      catIdsToSearch.push(l2.id);
      for (const l3 of l2.children) {
        catIdsToSearch.push(l3.id);
      }
    }

    const whereClause: any = { categoryId: { in: catIdsToSearch }, status: 'ACTIVE' };
    if (keyword) whereClause.name = { contains: keyword, mode: 'insensitive' };

    const [dbProducts, dbTotal] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: { variants: { take: 1 } },
        orderBy: { [orderByField]: sortDir },
        skip: (pageNum - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    total = dbTotal;
    products = dbProducts.map(p => ({
      pid: p.cjId,
      productNameEn: p.name,
      productImage: p.images?.[0] || '',
      bigImage: p.images?.[0] || '',
      sellPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
    }));
  } catch (error) {
    console.warn(`[CategoryPage] DB query failed for ${slug}:`, error);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-gray-50 min-h-screen py-10 sm:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5">
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] font-bold uppercase mb-6 sm:mb-8 text-gray-400">
          <Link href="/" className="inline-flex items-center gap-1 text-inherit no-underline hover:text-[#FF6B00] transition-colors">
            <i className="fas fa-home text-[10px]"></i>
            <span className="hidden sm:inline">Home</span>
          </Link>
          {category.grandparent && (
            <><i className="fas fa-chevron-right text-[8px] opacity-40"></i><Link href={`/category/${category.grandparent.slug}`} className="text-inherit no-underline hover:text-[#FF6B00]">{category.grandparent.name}</Link></>
          )}
          {category.parent && (
            <><i className="fas fa-chevron-right text-[8px] opacity-40"></i><Link href={`/category/${category.parent.slug}`} className="text-inherit no-underline hover:text-[#FF6B00]">{category.parent.name}</Link></>
          )}
          <><i className="fas fa-chevron-right text-[8px] opacity-40"></i><span className="text-[#FF6B00]">{category.name}</span></>
        </nav>

        <header className="mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1A1A1A]">{category.name}</h1>
              <p className="text-gray-500 font-semibold text-sm sm:text-base">{total.toLocaleString()} products available</p>
            </div>
            <FilterSortBar slug={slug} />
          </div>

          {category.children.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 sm:mt-6">
              {category.children.map(child => (
                <Link key={child.id} href={`/category/${child.slug}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs sm:text-[13px] font-semibold text-gray-600 no-underline hover:border-[#FF6B00] hover:text-[#FF6B00]">
                  <i className="fas fa-chevron-right text-[8px] opacity-40"></i> {child.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        {products.length > 0 ? (
          <>
            <div className="grid gap-3 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((product: any) => (
                <ProductCard key={product.id || product.pid} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 sm:gap-4 mt-10 sm:mt-14">
                {pageNum > 1 && (
                  <Link href={{ query: { ...sParams, page: pageNum - 1 } }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold border border-gray-200 text-sm no-underline hover:bg-gray-50 text-[#1A1A1A]">
                    <i className="fas fa-chevron-left text-[10px]"></i> Prev
                  </Link>
                )}
                <div className="flex gap-1.5 sm:gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let startPage = Math.max(1, pageNum - 2);
                    const endPage = Math.min(totalPages, startPage + 4);
                    if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
                    const p = startPage + i;
                    if (p > totalPages) return null;
                    return (
                      <Link key={p} href={{ query: { ...sParams, page: p } }}
                        className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-md font-semibold no-underline text-sm ${pageNum === p ? 'bg-[#FF6B00] text-white' : 'border border-gray-200 text-[#1A1A1A] hover:bg-gray-50'}`}
                      >{p}</Link>
                    );
                  })}
                </div>
                {pageNum < totalPages && (
                  <Link href={{ query: { ...sParams, page: pageNum + 1 } }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-semibold border border-gray-200 text-sm no-underline hover:bg-gray-50 text-[#1A1A1A]">
                    Next <i className="fas fa-chevron-right text-[10px]"></i>
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl p-10 sm:p-16 text-center border border-gray-200">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
              <i className="fas fa-inbox text-xl sm:text-3xl"></i>
            </div>
            <h2 className="text-lg sm:text-xl font-black mb-2 text-[#1A1A1A]">No products found</h2>
            <p className="text-gray-500 text-sm sm:text-base">Try adjusting your filters or explore another category.</p>
            <Link href={`/category/${slug}`} className="inline-flex items-center justify-center px-5 py-2.5 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] no-underline text-sm mt-5">Clear All Filters</Link>
          </div>
        )}
      </div>
    </div>
  );
}
