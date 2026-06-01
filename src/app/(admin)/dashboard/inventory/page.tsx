import { prisma } from '@/lib/db';
import InventoryList from './InventoryList';

export const dynamic = 'force-dynamic';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt((resolvedSearchParams.page as string) || '1', 10);
  const pageSize = 20;

  const categoryId = resolvedSearchParams.categoryId as string | undefined;
  const sort = (resolvedSearchParams.sort as string) || 'newest';

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'oldest') orderBy = { createdAt: 'asc' };
  if (sort === 'stock_desc') orderBy = { totalStock: 'desc' };
  if (sort === 'stock_asc') orderBy = { totalStock: 'asc' };
  if (sort === 'name_asc') orderBy = { name: 'asc' };
  if (sort === 'name_desc') orderBy = { name: 'desc' };

  const whereCondition: any = {};
  if (categoryId) {
    whereCondition.categoryId = categoryId;
  }

  const total = await prisma.product.count({ where: whereCondition });
  const products = await prisma.product.findMany({
    where: whereCondition,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { 
      variants: {
        orderBy: { inventory: 'asc' }
      },
    },
    orderBy: orderBy
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const now = new Date();
  const activeCoupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    },
    include: {
      products: true
    }
  });

  const serializedCoupons = activeCoupons.map(c => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minPurchase: c.minPurchase,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    isActive: c.isActive,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    products: c.products.map(p => ({
      id: p.id,
      productCjId: p.productCjId
    }))
  }));

  const serializedProducts = JSON.parse(JSON.stringify(products));
  const serializedCategories = JSON.parse(JSON.stringify(categories));

  return (
    <div>
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Inventory Manager</h2>
          <p className="text-[#64748B] font-semibold">Manage imported products, variants, and real-time stock levels.</p>
        </div>
      </div>

      <InventoryList 
        initialProducts={serializedProducts} 
        total={total} 
        currentPage={page} 
        categories={serializedCategories}
        currentCategory={categoryId || ''}
        currentSort={sort || 'newest'}
        activeCoupons={serializedCoupons}
      />
    </div>
  );
}
