import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pid = '1767475018784583680';
  const vid = '1767475019656998912';
  
  // Cek produk dari DB
  const product = await prisma.product.findUnique({
    where: { cjId: pid },
    include: { variants: true }
  });
  
  if (product) {
    console.log('=== PRODUK DARI DB ===');
    console.log('Nama:', product.name);
    console.log('Images:', product.images?.length);
    
    const variant = product.variants.find(v => v.cjId === vid);
    if (variant) {
      console.log('\n=== VARIANT ===');
      console.log('Variant ID:', variant.cjId);
      console.log('SKU:', variant.sku);
      console.log('Color:', variant.color);
      console.log('Size:', variant.size);
      console.log('Weight:', variant.weight);
      console.log('baseCost:', variant.baseCost);
      console.log('sellingPrice:', variant.sellingPrice);
      console.log('Inventory:', variant.inventory);
    } else {
      console.log('\nVariant tidak ditemukan di DB');
      console.log('Semua variant:', product.variants.map(v => ({ id: v.cjId, color: v.color, size: v.size, price: v.sellingPrice })));
    }
  } else {
    console.log('Produk tidak ditemukan di DB');
  }
  
  // Cek coupon RAINBOOT20
  const coupon = await prisma.coupon.findUnique({
    where: { code: 'RAINBOOT20' },
    include: { products: true }
  });
  
  if (coupon) {
    console.log('\n=== COUPON RAINBOOT20 ===');
    console.log('Type:', coupon.type);
    console.log('Value:', coupon.value);
    console.log('Description:', coupon.description);
    console.log('Min Purchase:', coupon.minPurchase);
    console.log('Max Uses:', coupon.maxUses);
    console.log('Used Count:', coupon.usedCount);
    console.log('Is Active:', coupon.isActive);
    console.log('Expires At:', coupon.expiresAt);
    console.log('Products:', coupon.products.map(p => p.productCjId));
  } else {
    console.log('\nCoupon RAINBOOT20 tidak ditemukan');
  }
  
  // Cek settings
  const settings = await prisma.storeSetting.findMany();
  console.log('\n=== SETTINGS ===');
  settings.forEach(s => console.log(`${s.key}: ${s.value}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
