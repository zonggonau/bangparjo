import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  console.log('=== KATEGORI DARI DATABASE POSTGRESQL ===');
  console.log('Total kategori:', cats.length);
  console.log('');
  // Level 1 (parentId = null)
  const level1 = cats.filter(c => !c.parentId);
  for (const l1 of level1) {
    console.log('📁 ' + l1.name + ' (cjId: ' + (l1.cjId || '-') + ')');
    const level2 = cats.filter(c => c.parentId === l1.id);
    for (const l2 of level2) {
      console.log('  📂 ' + l2.name);
      const level3 = cats.filter(c => c.parentId === l2.id);
      for (const l3 of level3) {
        console.log('    📄 ' + l3.name);
      }
    }
    console.log('');
  }
  await prisma.$disconnect();
}
main();
