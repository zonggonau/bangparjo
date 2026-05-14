import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import styles from '@/app/(store)/page.module.css';

export default async function HomeBestSellers() {
  // 1. Try local DB first
  const dbProducts = await prisma.product.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { variants: true }
  });

  let mainProducts = dbProducts.map(p => ({
    pid: p.cjId,
    productName: p.name,
    productNameEn: p.name,
    productImage: p.images[0],
    bigImage: p.images[0],
    sellPrice: p.variants[0]?.sellingPrice || 0,
    categoryName: 'Imported',
  }));

  if (mainProducts.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className="sectionHeader">
          <div>
            <h2 className="sectionTitle">🔥 Social Buzz — Trending Now</h2>
            <p className="sectionSubtitle">What everyone is shopping this week</p>
          </div>
          <Link href="/?q=trending" className="viewAllLink">View All →</Link>
        </div>
        <div className="productGrid">
          {mainProducts.map((product, index) => (
            <ProductCard key={product.pid} product={product} priority={index < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
