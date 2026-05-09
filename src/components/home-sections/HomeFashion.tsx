import { getProducts } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import styles from '@/app/(store)/page.module.css';

export default async function HomeFashion() {
  // 1. Try local DB
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: { 
      OR: [
        { name: { contains: 'Bag', mode: 'insensitive' } },
        { name: { contains: 'Shoes', mode: 'insensitive' } },
        { name: { contains: 'Clothing', mode: 'insensitive' } },
        { name: { contains: 'Watch', mode: 'insensitive' } },
      ]
    },
    include: { variants: true }
  });

  let mainProducts = dbProducts.map(p => ({
    pid: p.cjId,
    productName: p.name,
    productNameEn: p.name,
    productImage: p.images[0],
    bigImage: p.images[0],
    sellPrice: p.variants[0]?.sellingPrice || 0,
    categoryName: 'Fashion',
  }));

  // 2. API Fallback
  if (mainProducts.length < 5) {
    const res = await getProducts({ categoryId: 'A8B2857F-622E-4464-98F1-4F23F976D1F6', pageSize: 10 });
    const apiProducts = res.success && res.data ? res.data.list : [];
    const pids = new Set(mainProducts.map(p => p.pid));
    apiProducts.forEach((p: any) => { if (!pids.has(p.pid)) mainProducts.push(p); });
  }

  if (mainProducts.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className="sectionHeader">
          <div>
            <h2 className="sectionTitle">👗 Trending Fashion</h2>
            <p className="sectionSubtitle">Stay stylish with the latest collections</p>
          </div>
          <Link href="/category/fashion-jewelry-123ACC01-7A11-4FB9-A532-338C0E7C04C5" className="viewAllLink">View All →</Link>
        </div>
        <div className="productGrid">
          {mainProducts.map((product) => (
            <ProductCard key={product.pid} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
