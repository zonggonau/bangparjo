import { prisma } from '@/lib/db';
import { getFullCategoryTreeAction } from '@/lib/actions-catalog';
import InventoryList from './InventoryList';
import RecalculatePricesButton from '@/components/admin/RecalculatePricesButton';
import FixCategoryLinksButton from '@/components/admin/FixCategoryLinksButton';

export const dynamic = 'force-dynamic';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt((resolvedSearchParams.page as string) || '1', 10);
  const pageSize = parseInt((resolvedSearchParams.limit as string) || '20', 10);
  const searchQuery = ((resolvedSearchParams.search as string) || '').trim();

  const categoryId = resolvedSearchParams.categoryId as string | undefined;
  const sort = (resolvedSearchParams.sort as string) || 'newest';

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'oldest') orderBy = { createdAt: 'asc' };
  if (sort === 'stock_desc') orderBy = { totalStock: 'desc' };
  if (sort === 'stock_asc') orderBy = { totalStock: 'asc' };
  if (sort === 'name_asc') orderBy = { name: 'asc' };
  if (sort === 'name_desc') orderBy = { name: 'desc' };

  const whereCondition: any = {};
  
  // Recursive category lookup to include subcategories
  if (categoryId) {
    const getDescendants = async (id: string): Promise<string[]> => {
      const children = await prisma.category.findMany({
        where: { parentId: id },
        select: { id: true }
      });
      const childIds = children.map(c => c.id);
      const descendantIds = await Promise.all(childIds.map(getDescendants));
      return [id, ...childIds, ...descendantIds.flat()];
    };
    const categoryIdsFilter = await getDescendants(categoryId);
    whereCondition.categoryId = { in: categoryIdsFilter };
  }

  if (searchQuery) {
    whereCondition.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { cjId: { contains: searchQuery, mode: 'insensitive' } },
      { variants: { some: { sku: { contains: searchQuery, mode: 'insensitive' } } } }
    ];
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

  // Load CJ Category tree
  const catTreeRes = await getFullCategoryTreeAction();
  const categoryTree = catTreeRes.success ? catTreeRes.data || [] : [];

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
  const serializedCategoryTree = JSON.parse(JSON.stringify(categoryTree));

  return (
    <div>
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-[28px] font-black mb-2 text-[#1E293B]">Inventory Manager</h2>
          <p className="text-[#64748B] font-semibold">Manage imported products, variants, and real-time stock levels.</p>
        </div>
        <div className="flex gap-3">
          <FixCategoryLinksButton />
          <RecalculatePricesButton />
        </div>
      </div>

      <InventoryList 
        initialProducts={serializedProducts} 
        total={total} 
        currentPage={page} 
        limit={pageSize}
        search={searchQuery}
        categoryTree={serializedCategoryTree}
        currentCategory={categoryId || ''}
        currentSort={sort || 'newest'}
        activeCoupons={serializedCoupons}
      />
    </div>
  );
}
