import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({ 
    where: { id: '4d1f183f-187d-46de-9cde-f6ade300dec8' }, 
    include: { variants: true } 
  });
  if (product) {
    console.log('Product name:', product.name);
    console.log('Variants:');
    product.variants.forEach(v => {
      console.log('  -', v.color, v.size, '| baseCost:', v.baseCost, '| sellingPrice:', v.sellingPrice, '| inventory:', v.inventory);
    });
  } else {
    console.log('Product not found in DB');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
