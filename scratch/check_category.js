const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ambil beberapa sampel produk dan kategorinya
  const products = await prisma.product.findMany({
    take: 5,
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log('=== SAMPLE PRODUCTS ===');
  products.forEach(p => {
    console.log({
      cjId: p.cjId,
      name: p.name.slice(0, 50),
      categoryId: p.categoryId,        // FK ke tabel Category (UUID lokal)
      cjCategoryId: p.cjCategoryId,    // ID langsung dari CJ API
      linkedCategoryName: p.category ? p.category.name : '(null)',
      linkedCategoryCjId: p.category ? p.category.cjId : '(null)',
    });
  });

  // Ambil beberapa kategori untuk perbandingan
  const cats = await prisma.category.findMany({ take: 8, orderBy: { name: 'asc' } });
  console.log('\n=== SAMPLE CATEGORIES (dari tabel Category) ===');
  cats.forEach(c => {
    console.log({ id: c.id, cjId: c.cjId, name: c.name, parentId: c.parentId ? '(ada)' : 'ROOT' });
  });

  // Cek berapa produk yang punya categoryId null vs isi
  const withCat = await prisma.product.count({ where: { categoryId: { not: null } } });
  const withCjCat = await prisma.product.count({ where: { cjCategoryId: { not: null } } });
  const total = await prisma.product.count();
  console.log('\n=== STATS ===');
  console.log({ total, withCategoryRelation: withCat, withCjCategoryId: withCjCat, withoutBoth: total - withCat });

  // Cek: apakah cjCategoryId di produk cocok dengan cjId di Category?
  const productsWithCjCat = await prisma.product.findMany({
    where: { cjCategoryId: { not: null } },
    take: 5,
    select: { cjId: true, name: true, cjCategoryId: true, categoryId: true }
  });

  console.log('\n=== CEK MATCH cjCategoryId vs Category.cjId ===');
  for (const p of productsWithCjCat) {
    const matchedCategory = await prisma.category.findFirst({
      where: { cjId: p.cjCategoryId }
    });
    console.log({
      productCjId: p.cjId,
      productName: p.name.slice(0, 40),
      productCjCategoryId: p.cjCategoryId,
      matchedCategoryName: matchedCategory ? matchedCategory.name : '❌ TIDAK ADA DI TABEL CATEGORY',
      categoryRelationLinked: p.categoryId ? 'ya' : '❌ null (tidak linked ke category table)',
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
