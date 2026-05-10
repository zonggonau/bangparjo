import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getProducts } from '@/lib/cj-api';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import styles from './category.module.css';
import SortSelector from '@/components/SortSelector';

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
  const description = `Temukan koleksi ${category.name} terbaik dengan pengiriman ke seluruh Indonesia. Harga bersaing dan kualitas terjamin di BangParjo Shop.`;

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
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h1>Category Not Found</h1>
        <Link href="/" style={{ color: 'var(--primary)' }}>Return Home</Link>
      </div>
    );
  }

  // 2. Fetch produk dari CJ API menggunakan cjId kategori + Filter
  let products: any[] = [];
  let total = 0;

  try {
    const productRes = await getProducts({
      categoryId: category.cjId || undefined,
      pageSize: 42,
      pageNum: pageNum,
      minPrice,
      maxPrice,
      searchType: sort,
    });
    
    if (productRes.success && productRes.data) {
      products = productRes.data.list;
      total = productRes.data.total;
    }
  } catch (error) {
    console.warn(`[CategoryPage] CJ API failed for ${slug}, falling back to DB products.`);
  }

  // 3. Fallback ke DB jika API gagal atau kosong
  if (products.length === 0) {
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
      take: 42,
      skip: (pageNum - 1) * 42,
    });

    products = dbProducts.map(p => ({
      pid: p.cjId,
      productName: p.name,
      productNameEn: p.name,
      productImage: p.images[0],
      bigImage: p.images[0],
      sellPrice: p.variants[0]?.sellingPrice || 0,
      categoryName: category?.name || 'Product',
    }));
    total = await prisma.product.count({ where: { categoryId: category.id } });
  }

  const totalPages = Math.ceil(total / 42);

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
