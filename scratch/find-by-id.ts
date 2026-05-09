import { prisma } from '../src/lib/db';

async function main() {
  const cat = await prisma.category.findFirst({
    where: { cjId: 'A8B2857F-622E-4464-98F1-4F23F976D1F6' },
    select: { name: true, slug: true }
  });
  const cat2 = await prisma.category.findFirst({
    where: { cjId: 'D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2' },
    select: { name: true, slug: true }
  });

  console.log('Women Clothing Category:', cat);
  console.log('Electronics Category:', cat2);
}

main();
