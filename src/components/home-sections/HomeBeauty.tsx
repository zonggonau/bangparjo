import { getProducts } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import styles from '@/app/(store)/page.module.css';

export default async function HomeBeauty() {
  // 1. Try local DB
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: { 
      OR: [
        { name: { contains: 'Beauty', mode: 'insensitive' } },
        { name: { contains: 'Skin', mode: 'insensitive' } },
        { name: { contains: 'Makeup', mode: 'insensitive' } },
        { name: { contains: 'Hair', mode: 'insensitive' } },
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
    categoryName: 'Beauty',
  }));

  // 2. API Fallback (Only if DB is empty and ignore errors)
  if (mainProducts.length < 1) {
    try {
      const res = await getProducts({ categoryId: '2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902', pageSize: 10 });
      if (res.success && res.data) {
        const apiProducts = res.data.list;
        const pids = new Set(mainProducts.map(p => p.pid));
        apiProducts.forEach((p: any) => { if (!pids.has(p.pid)) mainProducts.push(p); });
      }
    } catch (e) {
      console.warn('[HomeBeauty] CJ API Fallback failed, using DB only.');
    }
  }

  if (mainProducts.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className="sectionHeader">
          <div>
            <h2 className="sectionTitle">💄 Beauty & Health</h2>
            <p className="sectionSubtitle">Glow up with our trending products</p>
          </div>
          <Link href="/category/health-beauty-and-hair-2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902" className="viewAllLink">View All →</Link>
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
