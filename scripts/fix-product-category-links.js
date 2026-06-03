/**
 * One-time fix: Sambungkan Product.categoryId ke tabel Category
 * berdasarkan Product.cjCategoryId → Category.cjId
 *
 * Jalankan: node scripts/fix-product-category-links.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting category link fix...\n');

  // Ambil semua produk yang punya cjCategoryId tapi categoryId masih null
  const products = await prisma.product.findMany({
    where: {
      cjCategoryId: { not: null },
      categoryId: null,
    },
    select: {
      id: true,
      cjId: true,
      name: true,
      cjCategoryId: true,
    },
  });

  console.log(`Found ${products.length} products to fix.\n`);

  let fixed = 0;
  let notFound = 0;
  let errors = 0;

  // Cache kategori supaya tidak query berulang untuk cjCategoryId yang sama
  const categoryCache = new Map();

  for (const product of products) {
    try {
      const cjCatId = product.cjCategoryId;

      // Cek cache dulu
      let categoryId = categoryCache.get(cjCatId);

      if (categoryId === undefined) {
        // Cari di DB
        const cat = await prisma.category.findFirst({
          where: { cjId: cjCatId },
          select: { id: true, name: true },
        });

        if (cat) {
          categoryId = cat.id;
          categoryCache.set(cjCatId, cat.id);
          // console.log(`  [MATCH] CJ Cat ${cjCatId} → DB Category "${cat.name}" (${cat.id})`);
        } else {
          categoryId = null;
          categoryCache.set(cjCatId, null);
        }
      }

      if (categoryId) {
        await prisma.product.update({
          where: { id: product.id },
          data: { categoryId: categoryId },
        });
        fixed++;
        if (fixed % 10 === 0) {
          console.log(`  ✅ Fixed ${fixed}/${products.length} products...`);
        }
      } else {
        notFound++;
        // console.log(`  ⚠️  No match for cjCategoryId="${cjCatId}" (product: ${product.cjId})`);
      }
    } catch (err) {
      errors++;
      console.error(`  ❌ Error on product ${product.cjId}:`, err.message);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`✅  Fixed:     ${fixed}`);
  console.log(`⚠️   No match: ${notFound} (cjCategoryId tidak ada di tabel Category)`);
  console.log(`❌  Errors:   ${errors}`);
  console.log(`📦  Total:    ${products.length}`);
  console.log('═══════════════════════════════════════');

  // Verifikasi hasil
  const afterFix = await prisma.product.count({ where: { categoryId: { not: null } } });
  const stillNull = await prisma.product.count({ where: { categoryId: null } });
  console.log(`\n📊 After fix: ${afterFix} products linked, ${stillNull} still unlinked`);

  // Tampilkan contoh produk yang berhasil dilink
  const sample = await prisma.product.findMany({
    where: { categoryId: { not: null } },
    take: 3,
    include: { category: true },
    select: {
      cjId: true,
      name: true,
      cjCategoryId: true,
      categoryId: true,
      category: { select: { name: true, cjId: true } },
    },
  });

  console.log('\n📋 Sample linked products:');
  sample.forEach(p => {
    console.log(`  Product: ${p.name.slice(0, 40)}`);
    console.log(`    cjCategoryId: ${p.cjCategoryId}`);
    console.log(`    → Category: "${p.category?.name}" (${p.category?.cjId})\n`);
  });
}

main()
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
