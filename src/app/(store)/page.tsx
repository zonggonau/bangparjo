import { Suspense } from 'react';
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
import { prisma } from '@/lib/db';
import JsonLd from '@/components/JsonLd';

export const metadata = {
  title: 'BangParjo — Social Shopping Destination | Trending Finds & Community Picks',
  description: 'Discover viral finds, trending products, and community-curated picks at BangParjo. Shop the hype with your social shopping crew. 🔥 ✨',
  openGraph: {
    title: 'BangParjo — Social Shopping Destination',
    description: 'Shop trending finds and community picks. Join the social shopping revolution at BangParjo! 🔥',
    images: ['/logo-banner.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/logo-banner.png'],
  }
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  if (q) {
    const dbProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      },
      include: { variants: true },
      take: 40
    });
    const mainProducts = dbProducts.map(p => ({
      pid: p.cjId,
      productName: p.name,
      productNameEn: p.name,
      productImage: p.images[0],
      bigImage: p.images[0],
      sellPrice: p.variants[0]?.sellingPrice || 0,
      categoryName: 'Search Result',
    }));

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
      <JsonLd />
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

      {/* Why BangParjo */}
      <section className={styles.whySection}>
        <div className="container">
          <h2 className="sectionTitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Why Shop at BangParjo? 🔥
          </h2>
          <div className={styles.featureGrid}>
            {[
              { icon: '👥', title: 'Community Driven', desc: 'Real people, real reviews. Shop what the community loves and trusts.' },
              { icon: '⚡', title: 'Trending Finds', desc: 'Always stay ahead with viral products curated just for you.' },
              { icon: '🔒', title: 'Secure Payments', desc: 'Encrypted transactions with multiple payment methods accepted.' },
              { icon: '🔄', title: 'Easy 30-Day Returns', desc: 'Not loving it? No worries — hassle-free returns within 30 days.' },
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
