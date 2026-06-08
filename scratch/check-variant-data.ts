import { prisma } from '../src/lib/db';

async function main() {
  // Get some products with their variants
  const products = await prisma.product.findMany({
    take: 5,
    orderBy: { updatedAt: 'desc' },
    include: { variants: true }
  });

  for (const p of products) {
    console.log(`\n=== ${p.name} ===`);
    console.log(`ID: ${p.cjId}`);
    for (const v of p.variants) {
      console.log(`  [${v.cjId}] color="${v.color}" size="${v.size}" sku="${v.sku}"`);
    }
  }

  // Also check how many variants have empty color/size
  const totalVariants = await prisma.variant.count();
  const emptyColor = await prisma.variant.count({ where: { OR: [{ color: '' }, { color: null }] } });
  const emptySize = await prisma.variant.count({ where: { OR: [{ size: '' }, { size: null }] } });
  
  console.log(`\n=== Stats ===`);
  console.log(`Total variants: ${totalVariants}`);
  console.log(`Empty color: ${emptyColor}`);
  console.log(`Empty size: ${emptySize}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
