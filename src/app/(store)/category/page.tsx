
import { prisma } from '@/lib/db';
import Link from 'next/link';
import styles from './categories.module.css';

export const metadata = {
  title: 'All Categories | bangparjo.shop',
  description: 'Browse all product categories on bangparjo.shop',
};

export default async function AllCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Browse All Categories</h1>
        <div className={styles.grid}>
          {categories.map((cat) => (
            <div key={cat.id} className={styles.categoryCard}>
              <h2 className={styles.categoryName}>
                <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
              </h2>
              {cat.children && cat.children.length > 0 && (
                <ul className={styles.subList}>
                  {cat.children.map((sub) => (
                    <li key={sub.id}>
                      <Link href={`/category/${sub.slug}`}>{sub.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
