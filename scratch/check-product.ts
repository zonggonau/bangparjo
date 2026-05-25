import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findUnique({ 
    where: { cjId: '2509030436211624800' }, 
    include: { variants: true } 
  });
  if (product) {
    console.log('Product name:', product.name);
    console.log('Variants:');
    product.variants.forEach(v => {
      console.log('  -', v.color, v.size, '| sellingPrice:', v.sellingPrice, '| cjPrice:', v.cjPrice);
    });
  } else {
    console.log('Product not found in DB');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
