import { prisma } from '@/lib/db';
import InventoryList from './InventoryList';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    include: { 
      variants: {
        orderBy: { inventory: 'asc' }
      },
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Inventory Manager</h2>
        <p className="text-[#64748B] font-semibold">Manage imported products, variants, and real-time stock levels.</p>
      </div>

      <InventoryList initialProducts={products} />
    </div>
  );
}
