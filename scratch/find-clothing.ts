import { prisma } from '../src/lib/db';

async function main() {
  const clothing = await prisma.category.findMany({
    where: { name: { contains: 'Clothing', mode: 'insensitive' } },
    select: { name: true, slug: true }
  });

  console.log('Clothing:', clothing);
}

main();
