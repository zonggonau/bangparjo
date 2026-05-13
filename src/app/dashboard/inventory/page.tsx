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
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">Inventory Manager</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1">Manage imported products, variants, and real-time stock levels.</p>
        </div>
      </div>

      <InventoryList initialProducts={products} />
    </div>
  );
}

