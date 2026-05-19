import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.category.count();
  const parents = await prisma.category.count({ where: { parentId: null } });
  const children = await prisma.category.count({ where: { parentId: { not: null } } });
  console.log('Total kategori:', total);
  console.log('Kategori induk:', parents);
  console.log('Sub kategori:', children);
  await prisma.$disconnect();
}

main();
