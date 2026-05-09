import { prisma } from '../src/lib/db';

async function main() {
  const electronics = await prisma.category.findMany({
    where: { name: { contains: 'Electronics', mode: 'insensitive' } },
    select: { name: true, slug: true }
  });
  const fashion = await prisma.category.findMany({
    where: { name: { contains: 'Fashion', mode: 'insensitive' } },
    select: { name: true, slug: true }
  });
  const apparel = await prisma.category.findMany({
    where: { name: { contains: 'Apparel', mode: 'insensitive' } },
    select: { name: true, slug: true }
  });

  console.log('Electronics:', electronics);
  console.log('Fashion/Apparel:', [...fashion, ...apparel]);
}

main();
