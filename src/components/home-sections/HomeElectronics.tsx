import { getProducts } from '@/lib/cj-api';
import { prisma } from '@/lib/db';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import styles from '@/app/(store)/page.module.css';

export default async function HomeElectronics() {
  // 1. Try local DB
  const dbProducts = await prisma.product.findMany({
    take: 10,
    where: { 
      OR: [
        { name: { contains: 'Phone', mode: 'insensitive' } },
        { name: { contains: 'Watch', mode: 'insensitive' } },
        { name: { contains: 'Earphone', mode: 'insensitive' } },
        { name: { contains: 'Camera', mode: 'insensitive' } },
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
    categoryName: 'Electronics',
  }));

  // 2. API Fallback
  if (mainProducts.length < 5) {
    const res = await getProducts({ categoryId: 'D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2', pageSize: 10 });
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
            <h2 className="sectionTitle">📱 Electronics & Gadgets</h2>
            <p className="sectionSubtitle">The latest tech at your fingertips</p>
          </div>
          <Link href="/category/consumer-electronics-D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2" className="viewAllLink">View All →</Link>
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
