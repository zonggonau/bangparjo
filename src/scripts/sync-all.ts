/**
 * Sync All — CJ Products → Database
 * Jalanin setelah API Key bener:
 *   npx tsx src/scripts/sync-all.ts
 * 
 * Proses:
 * 1. Sync kategori
 * 2. Import trending products (top 50)
 * 3. Update inventory
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { getCategories, getProducts, getProductDetails } from '@/lib/cj-api';

const prisma = new PrismaClient();
const DELAY_MS = 2000; // 2s delay antar request biar gak kena QPS

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function syncCategories() {
  console.log('\n📦 === SYNC CATEGORIES ===');
  const res = await getCategories();
  if (!res.success) {
    throw new Error(`Gagal fetch kategori: ${res.message}`);
  }
  const cats = res.data as any[];
  console.log(`Found ${cats.length} main categories.`);

  let count = 0;
  for (const cat of cats) {
    const catId = cat.categoryFirstId;
    if (!catId) continue;

    const l1 = await prisma.category.upsert({
      where: { cjId: catId },
      update: { name: cat.categoryFirstName },
      create: { cjId: catId, name: cat.categoryFirstName, slug: slugify(cat.categoryFirstName, { lower: true }) + '-' + catId },
    });
    count++;

    for (const sub of (cat.categoryFirstList || [])) {
      const subId = sub.categorySecondId;
      if (!subId) continue;
      await prisma.category.upsert({
        where: { cjId: subId },
        update: { name: sub.categorySecondName },
        create: { cjId: subId, name: sub.categorySecondName, slug: slugify(sub.categorySecondName, { lower: true }) + '-' + subId, parentId: l1.id },
      });
      count++;

      for (const subsub of (sub.categorySecondList || [])) {
        if (!subsub.categoryId) continue;
        await prisma.category.upsert({
          where: { cjId: subsub.categoryId },
          update: { name: subsub.categoryName },
          create: { cjId: subsub.categoryId, name: subsub.categoryName, slug: slugify(subsub.categoryName, { lower: true }) + '-' + subsub.categoryId },
        });
        count++;
      }
    }
  }
  console.log(`✅ ${count} kategori tersimpan.`);
}

async function syncProducts() {
  console.log('\n📦 === SYNC TRENDING PRODUCTS ===');
  
  let imported = 0;
  let page = 1;
  const maxPages = 3; // 3 pages × 20 = max 60 produk

  while (page <= maxPages) {
    console.log(`\n📄 Page ${page}...`);
    const res = await getProducts({ pageNum: page, pageSize: 20, searchType: 2 });
    
    if (!res.success || !res.data?.list?.length) {
      console.log(`   No more products.`);
      break;
    }

    const products = res.data.list;
    for (const p of products) {
      try {
        await sleep(DELAY_MS);
        const detail = await getProductDetails(p.pid);
        if (!detail.success || !detail.data) {
          console.log(`   ⚠️  Skip ${p.pid}: ${detail.message}`);
          continue;
        }

        const d = detail.data;
        await prisma.$executeRaw`
          INSERT INTO "Product" (id, "cjId", name, description, images, "variantCount", "totalStock", status, "createdAt", "updatedAt")
          VALUES (${crypto.randomUUID()}, ${d.pid}, ${d.productNameEn}, ${d.description || ''}, 
                  ${d.productImage ? [d.productImage] : []}, ${d.variants?.length || 0},
                  ${d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0},
                  'ACTIVE', NOW(), NOW())
          ON CONFLICT ("cjId") DO UPDATE SET
            name = EXCLUDED.name, description = EXCLUDED.description,
            "variantCount" = EXCLUDED."variantCount", "totalStock" = EXCLUDED."totalStock",
            "updatedAt" = NOW()
        `;

        // Get product ID
        const prod = await prisma.$queryRawUnsafe<Array<{id: string}>>(
          `SELECT id FROM "Product" WHERE "cjId" = $1 LIMIT 1`, d.pid
        ) as Array<{id: string}>;
        
        if (prod?.length && d.variants?.length) {
          const productId = prod[0].id;
          await prisma.$executeRaw`DELETE FROM "Variant" WHERE "productId" = ${productId}`;
          
          for (const v of d.variants) {
            await prisma.$executeRaw`
              INSERT INTO "Variant" (id, "productId", "cjId", sku, color, size, weight, "baseCost", "sellingPrice", inventory, image)
              VALUES (${crypto.randomUUID()}, ${productId}, ${v.vid}, ${v.variantSku},
                      ${v.variantKey || ''}, ${v.variantNameEn || ''}, ${v.variantWeight || 0},
                      ${v.variantSellPrice || 0}, ${(v.variantSellPrice || 0) * 1.3},
                      ${v.inventory || 0}, ${v.variantImage || d.productImage})
            `;
          }
        }

        imported++;
        console.log(`   ✅ ${imported}. ${d.productNameEn}`);
      } catch (err: any) {
        console.log(`   ❌ Error import ${p.pid}: ${err.message}`);
      }
    }
    page++;
  }

  console.log(`\n✅ ${imported} produk berhasil di-import!`);
}

async function main() {
  console.log('🚀 CJ DATA SYNCHRONIZATION START');
  console.log('='.repeat(50));

  try {
    await syncCategories();
    await sleep(3000);
    await syncProducts();
    console.log('\n🎉 SEMUA SELESAI! Produk sekarang tampil di website.');
  } catch (err: any) {
    console.error('\n❌ Fatal error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
