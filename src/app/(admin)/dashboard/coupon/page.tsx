import { prisma } from '@/lib/db';
import CouponClientView from './CouponClientView';

export const dynamic = 'force-dynamic';

export default async function CouponManagementPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parseInt((searchParams.page as string) || '1', 10);
  const pageSize = 20;

  const total = await prisma.coupon.count();
  const coupons = await prisma.coupon.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { products: true },
    orderBy: { createdAt: 'desc' },
  });

  // Convert Date objects to ISO strings for client component
  const safeCoupons = coupons.map(c => ({
    ...c,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
    value: Number(c.value), // Ensure Decimal is converted
    products: (c.products || []).map(cp => ({
      productCjId: cp.productCjId
    }))
  }));

  // Fetch active products list for AI selection and linking
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      cjId: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <CouponClientView 
      coupons={safeCoupons} 
      total={total} 
      currentPage={page} 
      products={products} 
    />
  );
}

