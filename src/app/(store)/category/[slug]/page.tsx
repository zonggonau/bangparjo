import { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import SortSelector from '@/components/SortSelector';
import { getAppCache, setAppCache } from '@/lib/cache';
import { getCategoryBySlug as getCategoryBySlugLib, getCategoryHierarchy } from '@/lib/categories';
import { getProductsV2 } from '@/lib/cj';

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
  const sortParam = sParams.sort || 'default';
  
  let orderBy: number | undefined = undefined;
  let sortDir: 'desc' | 'asc' | undefined = undefined;

  switch (sortParam) {
    case 'newest': orderBy = 3; sortDir = 'desc'; break;
    case 'oldest': orderBy = 3; sortDir = 'asc'; break;
    case 'price-desc': orderBy = 2; sortDir = 'desc'; break;
    case 'price-asc': orderBy = 2; sortDir = 'asc'; break;
    case 'listed-desc': orderBy = 1; sortDir = 'desc'; break;
    case 'inventory-desc': orderBy = 4; sortDir = 'desc'; break;
    default: orderBy = 0; break;
  }

  const category = await getCategoryBySlug(slug);

  if (!category) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold mb-6 text-[#1A1A1A]">Category Not Found</h1>
        <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline">Return Home</Link>
      </div>
    );
  }

  let products: any[] = [];
  let total = 0;

  const cacheKey = `cat_api_products_${category.id}_p${pageNum}_s${sortParam}_min${minPrice || 0}_max${maxPrice || 0}`;

  try {
    const cachedData = await getAppCache<{ products: any[], total: number }>(cacheKey);
    if (cachedData) {
      products = cachedData.products;
      total = cachedData.total;
    } else {
      const res = await getProductsV2({ 
        categoryId: category.id, 
        page: pageNum, 
        size: 60,
        startSellPrice: minPrice,
        endSellPrice: maxPrice,
        orderBy: orderBy,
        sort: sortDir,
        features: ['enable_description'],
      });
      
      if (res.success && res.data) {
        const d = res.data;
        if (d.content && d.content.length > 0) {
          const rawProducts = d.content[0].productList || [];
          // Map CJProductV2 → CJProduct shape (ProductCard expects CJProduct fields)
          products = rawProducts.map((p: any) => ({
            pid: p.id || p.pid,
            productName: p.nameEn || p.productName || '',
            productNameEn: p.nameEn || p.productNameEn || '',
            productImage: p.bigImage || p.productImage || '',
            bigImage: p.bigImage || '',
            sellPrice: typeof p.sellPrice === 'number' ? p.sellPrice : parseFloat(p.sellPrice || p.nowPrice || '0'),
            nowPrice: p.nowPrice || '',
            discountPrice: p.discountPrice || '',
            categoryName: p.oneCategoryName || p.twoCategoryName || p.threeCategoryName || '',
            categoryId: p.categoryId || '',
            productSku: p.sku || '',
            productWeight: p.productWeight || 0,
            productUnit: p.productUnit || 'piece',
            listedNum: p.listedNum || 0,
            isFreeShipping: p.addMarkStatus === 1,
          }));

        }
        total = d.totalRecords || products.length;
        await setAppCache(cacheKey, { products, total }, 3600);
      }
    }
  } catch (error) {
    console.warn(`[CategoryPage] API query/cache failed for ${slug}:`, error);
  }

  const totalPages = Math.ceil(total / 60);

  return (
    <div className="bg-gray-50 min-h-screen py-16">
      <div className="max-w-[1400px] mx-auto px-5">
        {/* Breadcrumb with icons */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] font-bold uppercase mb-8 text-gray-400">
          <Link href="/" className="inline-flex items-center gap-1 text-inherit no-underline hover:text-[#FF6B00] transition-colors">
            <i className="fas fa-home text-[10px]"></i>
            <span className="hidden sm:inline">Home</span>
          </Link>
          {category.grandparent && (
            <>
              <i className="fas fa-chevron-right text-[8px] opacity-40"></i>
              <Link href={`/category/${category.grandparent.slug}`} className="text-inherit no-underline hover:text-[#FF6B00] transition-colors">{category.grandparent.name}</Link>
            </>

          )}
          {category.parent && (
            <>
              <i className="fas fa-chevron-right text-[8px] opacity-40"></i>
              <Link href={`/category/${category.parent.slug}`} className="text-inherit no-underline hover:text-[#FF6B00] transition-colors">{category.parent.name}</Link>
            </>
          )}
          <>
            <i className="fas fa-chevron-right text-[8px] opacity-40"></i>
            <span className="text-[#FF6B00]">{category.name}</span>
          </>
        </nav>

        {/* Header */}
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-[28px] sm:text-[36px] lg:text-[40px] font-black m-0 mb-2 text-[#1A1A1A]">{category.name}</h1>
              <p className="text-gray-500 font-semibold text-sm sm:text-base">{total.toLocaleString()} products available</p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <label htmlFor="sort" className="text-[11px] font-extrabold uppercase text-gray-400 hidden sm:block">Sort By:</label>
              <SortSelector currentSort={orderBy || 0} />
            </div>
          </div>

          {/* Subcategories as chips/pills */}
          {category.children.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {category.children.map(child => (
                <Link
                  key={child.id}
                  href={`/category/${child.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border border-gray-200 text-[12px] sm:text-[13px] font-semibold text-gray-600 no-underline transition-all duration-200 hover:border-[#FF6B00] hover:text-[#FF6B00] hover:shadow-sm"
                >
                  <i className="fas fa-chevron-right text-[8px] opacity-40"></i>
                  {child.name}
                </Link>
              ))}
            </div>
          )}

          {/* Back to parent link if no children */}
          {category.children.length === 0 && category.parent && (
            <div className="mt-4">
              <Link href={`/category/${category.parent.slug}`} className="inline-flex items-center gap-2 text-[13px] font-bold text-[#FF6B00] no-underline hover:gap-3 transition-all">
                <i className="fas fa-arrow-left text-[11px]"></i>
                Back to {category.parent.name}
              </Link>
            </div>
          )}
        </header>        {/* Products Grid - Full Width */}
        {products.length > 0 ? (
          <>
            <div className="grid gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((product: any) => (
                <ProductCard key={product.id || product.pid} product={product} />

              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 sm:gap-6 mt-12 sm:mt-16">
                {pageNum > 1 && (
                  <Link 
                    href={{ query: { ...sParams, page: pageNum - 1 } }} 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold border border-gray-200 text-[#1A1A1A] hover:bg-gray-50 transition-all duration-200 no-underline text-sm"
                  >
                    <i className="fas fa-chevron-left text-[10px]"></i>
                    Prev
                  </Link>
                )}
                
                <div className="flex gap-1.5 sm:gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let startPage = Math.max(1, pageNum - 2);
                    let endPage = Math.min(totalPages, startPage + 4);
                    if (endPage === totalPages) {
                      startPage = Math.max(1, endPage - 4);
                    }
                    
                    const p = startPage + i;
                    if (p > totalPages) return null;
                    
                    const isActive = pageNum === p;
                    return (
                      <Link
                        key={p}
                        href={{ query: { ...sParams, page: p } }}
                        className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-md font-semibold no-underline transition-all duration-200 text-sm ${isActive ? 'bg-[#FF6B00] text-white' : 'border border-gray-200 text-[#1A1A1A] hover:bg-gray-50'}`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>

                {pageNum < totalPages && (
                  <Link 
                    href={{ query: { ...sParams, page: pageNum + 1 } }} 
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold border border-gray-200 text-[#1A1A1A] hover:bg-gray-50 transition-all duration-200 no-underline text-sm"
                  >
                    Next
                    <i className="fas fa-chevron-right text-[10px]"></i>
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-[32px] p-16 sm:p-20 text-center border border-gray-200">
            <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-50 mx-auto mb-6 text-2xl sm:text-3xl text-gray-300">
              <i className="fas fa-inbox"></i>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mb-3 text-[#1A1A1A]">No products found</h2>
            <p className="text-gray-500 mb-8 text-sm sm:text-base">Try adjusting your filters or explore another category.</p>
            <Link href={`/category/${slug}`} className="inline-flex items-center justify-center px-6 sm:px-8 py-3 rounded-md font-bold bg-[#FF6B00] text-white hover:bg-[#E06000] transition-all duration-200 no-underline text-sm">Clear All Filters</Link>
          </div>
        )}
      </div>
    </div>
  );
}
