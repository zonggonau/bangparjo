const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cjId = '2603240651381611900';
  
  // Find in Product table
  const p1 = await prisma.product.findFirst({
    where: {
      OR: [
        { cjId: cjId },
        { cjId: { contains: cjId } },
        { name: { contains: 'washing' } },
        { name: { contains: 'Water Gun', mode: 'insensitive' } }
      ]
    },
    include: { variants: true }
  });

  if (p1) {
    console.log('--- FOUND IN PRODUCT ---');
    console.log('Name:', p1.name);
    console.log('CJ ID:', p1.cjId);
    console.log('Total Variants:', p1.variants.length);
    console.log('First Variant BaseCost:', p1.variants[0]?.baseCost);
    console.log('First Variant SellingPrice:', p1.variants[0]?.sellingPrice);
    p1.variants.slice(0, 5).forEach(v => {
      console.log(`  - Variant: color=${v.color}, size=${v.size}, BaseCost=${v.baseCost}, SellingPrice=${v.sellingPrice}`);
    });
  } else {
    console.log('Not found in Product table.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
