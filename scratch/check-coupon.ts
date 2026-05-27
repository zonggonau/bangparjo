import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Cari coupon yang terhubung dengan produk ini
  const couponProducts = await prisma.couponProduct.findMany({
    where: { productCjId: '1688004084063805440' },
    include: { coupon: true }
  });
  console.log('CouponProducts found:', couponProducts.length);
  for (const cp of couponProducts) {
    console.log('Coupon:', JSON.stringify(cp.coupon, null, 2));
  }

  // Cari semua active coupons
  const allCoupons = await prisma.coupon.findMany({ where: { isActive: true } });
  console.log('\nAll active coupons:', allCoupons.length);
  for (const c of allCoupons) {
    console.log('  -', c.code, c.type, c.value, '| expires:', c.expiresAt, '| products count:', (await prisma.couponProduct.count({ where: { couponId: c.id } })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
