import { Suspense } from 'react';
import { getProducts } from '@/lib/cj-api';
import ProductCard from '@/components/ProductCard';
import CategoryBanner from '@/components/CategoryBanner';
import FeaturedSection from '@/components/FeaturedSection';
import PromoBanner from '@/components/PromoBanner';
import Newsletter from '@/components/Newsletter';
import TrustBadges from '@/components/TrustBadges';
import { ProductGridSkeleton } from '@/components/ProductSkeleton';
import HomeHero from '@/components/home-sections/HomeHero';
import HomeBestSellers from '@/components/home-sections/HomeBestSellers';
import HomeElectronics from '@/components/home-sections/HomeElectronics';
import HomeFashion from '@/components/home-sections/HomeFashion';
import HomeBeauty from '@/components/home-sections/HomeBeauty';
import styles from './page.module.css';
import Link from 'next/link';

export const metadata = {
  title: 'bangparjo.shop — Global Shopping, Best Prices',
  description: 'Find thousands of curated global products at the best prices. Fashion, Electronics, Beauty, and much more. Worldwide shipping.',
};

async function getCategoryProducts(categoryName: string, keywords: string[], cjCategoryId: string) {
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: { 
      OR: keywords.map(keyword => ({ name: { contains: keyword, mode: 'insensitive' } }))
    },
    include: { variants: true }
  });

  let products = dbProducts.map(p => ({
    pid: p.cjId,
    productName: p.name,
    productNameEn: p.name,
    productImage: p.images[0],
    bigImage: p.images[0],
    sellPrice: p.variants[0]?.sellingPrice || 0,
    categoryName: categoryName,
  }));

  if (products.length < 5) {
    const res = await getProducts({ categoryId: cjCategoryId, pageSize: 10 });
    const apiProducts = res.success && res.data ? res.data.list : [];
    const pids = new Set(products.map(p => p.pid));
    apiProducts.forEach((p: any) => { if (!pids.has(p.pid)) products.push(p); });
  }

  return products.slice(0, 10);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  if (q) {
    const mainRes = await getProducts({ pageSize: 40, keyWord: q });
    const mainProducts = mainRes.success && mainRes.data ? mainRes.data.list : [];

    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '2rem var(--container-padding)' }}>
          <div className={styles.searchHeader}>
            <h1>Search Results: <span className={styles.searchQuery}>&quot;{q}&quot;</span></h1>
            <p className={styles.searchCount}>{mainProducts.length} products found</p>
          </div>

          {mainProducts.length > 0 ? (
            <div className="productGrid">
              {mainProducts.map((product) => (
                <ProductCard key={product.pid} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h2>No products found</h2>
              <p>Try a different keyword or <Link href="/">return to home</Link></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== HOMEPAGE WITH SKELETONS =====
  return (
    <div className={styles.page}>
      <Suspense fallback={<div className="skeleton" style={{ height: '600px', width: '100%' }} />}>
        <HomeHero />
      </Suspense>

      <CategoryBanner />
      <PromoBanner />

      <Suspense fallback={
        <section className={styles.section}>
          <div className="container">
            <div className="sectionHeader"><div className="skeleton" style={{ width: '200px', height: '30px' }} /></div>
            <ProductGridSkeleton count={10} />
          </div>
        </section>
      }>
        <HomeBestSellers />
      </Suspense>

      <FeaturedSection />

      <Suspense fallback={
        <section className={styles.section}>
          <div className="container">
            <div className="sectionHeader"><div className="skeleton" style={{ width: '250px', height: '30px' }} /></div>
            <ProductGridSkeleton count={5} />
          </div>
        </section>
      }>
        <HomeElectronics />
      </Suspense>

      <Suspense fallback={
        <section className={styles.section}>
          <div className="container">
            <div className="sectionHeader"><div className="skeleton" style={{ width: '250px', height: '30px' }} /></div>
            <ProductGridSkeleton count={5} />
          </div>
        </section>
      }>
        <HomeFashion />
      </Suspense>

      <Suspense fallback={
        <section className={styles.section}>
          <div className="container">
            <div className="sectionHeader"><div className="skeleton" style={{ width: '250px', height: '30px' }} /></div>
            <ProductGridSkeleton count={5} />
          </div>
        </section>
      }>
        <HomeBeauty />
      </Suspense>

      <Newsletter />
      <TrustBadges />

      {/* Why Choose Us */}
      <section className={styles.whySection}>
        <div className="container">
          <h2 className="sectionTitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Why Shop at bangparjo.shop?
          </h2>
          <div className={styles.featureGrid}>
            {[
              { icon: '🌍', title: 'Worldwide Shipping', desc: 'We ship to 200+ countries. Your package, delivered anywhere on the globe.' },
              { icon: '💯', title: 'Genuine Products', desc: 'All products sourced from verified CJ Dropshipping suppliers.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Encrypted transactions with multiple payment methods accepted.' },
              { icon: '📞', title: '24/7 Support', desc: 'Our customer service team is always here to help you.' },
            ].map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
