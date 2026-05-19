import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' }
  });
  console.log('Total kategori level 1:', cats.length);
  cats.forEach(c => console.log(c.id, c.name, c.slug));
  await prisma.$disconnect();
}

main();
