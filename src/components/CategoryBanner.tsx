import Link from 'next/link';
import { prisma } from '@/lib/db';
import styles from './CategoryBanner.module.css';

const ICON_MAP: Record<string, string> = {
  'Consumer Electronics': '📱',
  'Computer & Office': '💻',
  'Home Improvement': '🏠',
  'Automobiles & Motorcycles': '🚗',
  'Jewelry': '💍',
  'Beauty': '💄',
  'Home & Garden': '🏡',
  'Kitchen': '🍳',
  'Toys & Kids': '🧸',
  'Sports': '⚽',
};

export default async function CategoryBanner() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    take: 12,
  });

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.grid}>
          {categories.map((cat, index) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={styles.categoryCard}
              style={{ 
                '--cat-color': `hsl(${index * 40}, 70%, 50%)`, 
                '--cat-bg': `hsl(${index * 40}, 70%, 95%)` 
              } as React.CSSProperties}
            >
              <div className={styles.categoryIcon}>
                {ICON_MAP[cat.name] || '📦'}
              </div>
              <span className={styles.categoryName}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
