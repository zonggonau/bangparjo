import { prisma } from '../src/lib/db';

async function main() {
  const women = await prisma.category.findMany({
    where: { name: { contains: 'Women', mode: 'insensitive' } },
    select: { name: true, slug: true }
  });

  console.log('Women:', women);
}

main();
