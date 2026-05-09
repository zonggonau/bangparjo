import { prisma } from '@/lib/db';
import InventoryList from './InventoryList';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: { 
      variants: {
        orderBy: { inventory: 'asc' }
      },
      category: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Inventory Manager</h1>
          <p style={{ color: '#71717a', marginTop: '0.25rem', fontSize: '0.9rem' }}>Manage imported products and their variants.</p>
        </div>
      </header>

      <InventoryList initialProducts={products} />
    </div>
  );
}
