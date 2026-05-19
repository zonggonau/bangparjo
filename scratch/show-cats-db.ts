import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({ take: 20, orderBy: { name: 'asc' } });
  console.log('Total kategori:', cats.length);
  cats.forEach(c => console.log(c.id, c.name, c.slug, c.parentId || '-'));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
