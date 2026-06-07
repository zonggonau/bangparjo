import { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import SearchFilters from '@/components/SearchFilters';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Search Products — BangParjo',
  description: 'Search and find trending products for your dropshipping store.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; category?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const sParams = await searchParams;
  const query = sParams.q?.trim() || '';
  const page = parseInt(sParams.page || '1', 10);
  const categoryFilter = sParams.category?.trim() || '';
  const minPrice = sParams.minPrice?.trim() ? parseFloat(sParams.minPrice) : null;
  const maxPrice = sParams.maxPrice?.trim() ? parseFloat(sParams.maxPrice) : null;
  const pageSize = 100;

  // Fetch categories for filter dropdown
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  let products: any[] = [];
  let total = 0;
  let error = '';

  // Always search if there's a query OR filters
  if (query || categoryFilter || minPrice !== null || maxPrice !== null) {
    try {
      const whereClause: any = {
        status: 'ACTIVE',
      };

      // Search Query
      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { cjId: { contains: query, mode: 'insensitive' } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
          { variants: { some: { sku: { contains: query, mode: 'insensitive' } } } },
        ];
      }

      // Category Filter
      if (categoryFilter) {
        const selectedCategory = await prisma.category.findUnique({
          where: { slug: categoryFilter },
          include: { 
            children: {
              include: {
                children: true
              }
            }
          }
        });

        if (selectedCategory) {
          const categoryIds = [selectedCategory.id];
          selectedCategory.children.forEach(child => {
            categoryIds.push(child.id);
            child.children.forEach(grandChild => {
              categoryIds.push(grandChild.id);
            });
          });

          whereClause.categoryId = { in: categoryIds };
        }
      }

      // Price Filter
      if (minPrice !== null || maxPrice !== null) {
        whereClause.variants = {
          some: {
            sellingPrice: {
              ...(minPrice !== null && { gte: minPrice }),
              ...(maxPrice !== null && { lte: maxPrice }),
            },
          },
        };
      }

      const [dbProducts, dbTotal] = await Promise.all([
        prisma.product.findMany({
          where: whereClause,
          include: { 
            variants: { 
              orderBy: { sellingPrice: 'asc' },
              take: 1 
            } 
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
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
    } catch (err: any) {
      error = err.message || 'Database error';
    }
  }

  const totalPages = Math.ceil(total / pageSize);


  // Build filter URL helper
  const buildFilterUrl = (params: Record<string, string>) => {
    const url = new URLSearchParams();
    if (query) url.set('q', query);
    Object.entries(params).forEach(([k, v]) => { if (v) url.set(k, v); });
    if (categoryFilter && !params.category) url.set('category', categoryFilter);
    if (minPrice && !params.minPrice) url.set('minPrice', minPrice);
    if (maxPrice && !params.maxPrice) url.set('maxPrice', maxPrice);
    if (page > 1 && !params.page) url.set('page', String(page));
    return `/search?${url.toString()}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-[1400px] mx-auto px-5">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold text-[#1A1A1A] mb-2">
            {query ? (
              <>Search results for &ldquo;<span className="text-[#FF6B00]">{query}</span>&rdquo;</>
            ) : (
              'Search Products'
            )}
          </h1>
          {query && (
            <p className="text-gray-500 text-sm">
              {total > 0 ? `${total} products found` : 'No products found'}
            </p>
          )}
        </div>



        {/* Filters Row */}
        {query && (
          <SearchFilters
            query={query}
            categoryFilter={categoryFilter}
            minPrice={minPrice}
            maxPrice={maxPrice}
            categories={categories}
          />
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6 text-sm font-semibold border border-red-200">
            {error}
          </div>
        )}

        {/* Empty State */}
        {query && products.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No products found</h3>
            <p className="text-gray-500 text-sm">Try different keywords or browse our categories</p>
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 && (
          <>
            <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((product: any) => (
                <ProductCard key={product.pid || product.spuId} product={product} />

              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {page > 1 && (
                  <a
                    href={buildFilterUrl({ page: String(page - 1) })}
                    className="px-4 py-2.5 rounded-md text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all duration-200 no-underline"
                  >
                    <i className="fas fa-chevron-left"></i> Previous
                  </a>
                )}
                <span className="flex items-center px-4 text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <a
                    href={buildFilterUrl({ page: String(page + 1) })}
                    className="px-4 py-2.5 rounded-md text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all duration-200 no-underline"
                  >
                    Next <i className="fas fa-chevron-right"></i>
                  </a>
                )}
              </div>
            )}
          </>
        )}

        {/* No query yet */}
        {!query && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">What are you looking for?</h3>
            <p className="text-gray-500 text-sm">Type a keyword above to search our global catalog</p>
          </div>
        )}
      </div>
    </div>
  );
}
