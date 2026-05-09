import { prisma } from '@/lib/db';
import { getProducts } from '@/lib/cj-api';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import styles from './category.module.css';
import SortSelector from '@/components/SortSelector';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  return {
    title: category ? category.name : 'Category',
    description: `Shop the best products in ${category?.name || 'our category'}.`,
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
  const sort = sParams.sort ? parseInt(sParams.sort) : 0; // 0=All, 2=Trending, 3=Newest

  // 1. Ambil detail kategori dari DB
  let category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: { take: 20 },
      parent: { include: { parent: true } }
    }
  });

  // 1.5 Smart Redirect for "Pretty Slugs" (Electronics, Fashion, etc)
  if (!category) {
    const commonMappings: Record<string, string> = {
      'electronics': 'consumer-electronics',
      'gadgets': 'consumer-electronics',
      'fashion': 'fashion-jewelry',
      'womens-clothing': 'fashion-jewelry', // Sementara ke jewelry karena parent clothing tidak ada di DB
      'beauty': 'health-beauty-and-hair'
    };

    if (commonMappings[slug]) {
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
        });
      }
    }
  }

  if (!category) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1>Category Not Found</h1>
        <Link href="/" style={{ color: 'var(--primary)' }}>Return Home</Link>
      </div>
    );
  }

  // 2. Fetch produk dari CJ API menggunakan cjId kategori + Filter
  const productRes = await getProducts({
    categoryId: category.cjId || undefined,
    pageSize: 42,
    pageNum: pageNum,
    minPrice,
    maxPrice,
    searchType: sort,
  });

  const products = productRes.success && productRes.data ? productRes.data.list : [];
  const total = productRes.success && productRes.data ? productRes.data.total : 0;
  const totalPages = Math.ceil(total / 40);

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Breadcrumbs moved here */}
            <nav className={styles.sidebarBreadcrumb}>
              <Link href="/">Home</Link>
              {category.parent?.parent && (
                 <div>
                   <span className={styles.separator}>›</span>
                   <Link href={`/category/${category.parent.parent.slug}`}>{category.parent.parent.name}</Link>
                 </div>
              )}
              {category.parent && (
                <div>
                   <span className={styles.separator}>›</span>
                   <Link href={`/category/${category.parent.slug}`}>{category.parent.name}</Link>
                </div>
              )}
              <div>
                <span className={styles.separator}>›</span>
                <span className={styles.breadcrumbActive}>{category.name}</span>
              </div>
            </nav>
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>Sub Categories</h3>
              {category.children.length > 0 ? (
                <ul className={styles.catList}>
                  {category.children.map(child => (
                    <li key={child.id}>
                      <Link href={`/category/${child.slug}`}>{child.name}</Link>
                    </li>
                  ))}
                </ul>
              ) : category.parent ? (
                <Link href={`/category/${category.parent.slug}`} className={styles.backLink}>
                  ← Back to {category.parent.name}
                </Link>
              ) : <p className={styles.emptyText}>No sub-categories</p>}
            </div>

            <div className={styles.sidebarSection} style={{ marginTop: '2rem' }}>
              <h3 className={styles.sidebarTitle}>Price Range (USD)</h3>
              <form action="" method="get" className={styles.filterForm}>
                <div className={styles.priceInputs}>
                  <input 
                    type="number" 
                    name="minPrice" 
                    placeholder="Min" 
                    defaultValue={sParams.minPrice} 
                    className={styles.filterInput}
                  />
                  <span>-</span>
                  <input 
                    type="number" 
                    name="maxPrice" 
                    placeholder="Max" 
                    defaultValue={sParams.maxPrice} 
                    className={styles.filterInput}
                  />
                </div>
                <input type="hidden" name="sort" value={sort} />
                <button type="submit" className={styles.filterBtn}>Apply Filter</button>
              </form>
            </div>
          </aside>

          {/* Main Content */}
          <main className={styles.content}>
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div>
                  <h1 className={styles.heroTitle}>{category.name}</h1>
                  <p className={styles.heroCount}>{total.toLocaleString()} products available</p>
                </div>
                
                <div className={styles.sortBox}>
                  <label htmlFor="sort">Sort By:</label>
                  <SortSelector currentSort={sort} className={styles.sortSelect} />
                </div>
              </div>
            </header>

            {products.length > 0 ? (
              <>
                <div className="productGrid">
                  {products.map((product) => (
                    <ProductCard key={product.pid} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    {pageNum > 1 && (
                      <Link 
                        href={{ query: { ...sParams, page: pageNum - 1 } }} 
                        className={styles.pageBtn}
                      >
                        Prev
                      </Link>
                    )}
                    
                    <div className={styles.pageNumbers}>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic to show 5 pages around current page
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
                            className={`${styles.pageNumber} ${pageNum === p ? styles.activePage : ''}`}
                          >
                            {p}
                          </Link>
                        );
                      })}
                    </div>

                    {pageNum < totalPages && (
                      <Link 
                        href={{ query: { ...sParams, page: pageNum + 1 } }} 
                        className={styles.pageBtn}
                      >
                        Next
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📭</div>
                <h2>No products found</h2>
                <p>Try adjusting your filters or explore another category.</p>
                <Link href={`/category/${slug}`} className={styles.clearBtn}>Clear All Filters</Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
