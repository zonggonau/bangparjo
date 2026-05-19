import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.category.count();
  const level1 = await prisma.category.count({ where: { parentId: null } });
  const allCats = await prisma.category.findMany({ include: { children: true } });
  const level2 = allCats.filter(c => c.parentId !== null && c.children.length > 0).length;
  const level3 = allCats.filter(c => c.parentId !== null && c.children.length === 0).length;
  
  console.log('Total kategori:', total);
  console.log('Level 1 (main):', level1);
  console.log('Level 2 (sub):', level2);
  console.log('Level 3 (leaf):', level3);
  
  const cats = await prisma.category.findMany({ where: { parentId: null }, orderBy: { name: 'asc' } });
  console.log('\nMain Categories:');
  cats.forEach(c => console.log('  -', c.name, '(cjId:', c.cjId, ')'));
  
  await prisma.$disconnect();
}

main();
