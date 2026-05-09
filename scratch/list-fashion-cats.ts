import { prisma } from '../src/lib/db';

async function main() {
  const cats = await prisma.category.findMany({
    where: { 
      OR: [
        { name: { contains: 'Apparel', mode: 'insensitive' } },
        { name: { contains: 'Cloth', mode: 'insensitive' } }
      ]
    },
    select: { name: true, slug: true }
  });

  console.log('Available Fashion/Clothing Cats:', cats);
}

main();
