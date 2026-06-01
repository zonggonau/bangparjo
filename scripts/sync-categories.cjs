#!/usr/bin/env node
/**
 * Sync CJ Dropshipping categories (nested format) to local DB
 * CJ API returns categories in 3 levels nested structure.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  if (!text) return 'uncategorized';
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

async function main() {
  console.log('📦 Fetching categories from CJ API...');

  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/getCategory', {
    headers: { 'Content-Type': 'application/json' }
  });
  // CJ uses custom auth header from DB token
  // The fetch won't work directly - we need to use the CJ access token
  // Let's get the token from DB
  const tokenRow = await prisma.storeSetting.findUnique({ where: { key: 'CJ_ACCESS_TOKEN' } });
  if (!tokenRow) {
    console.log('❌ CJ_ACCESS_TOKEN not found in DB');
    process.exit(1);
  }
  const token = tokenRow.value;

  const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/getCategory', {
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token
    }
  });
  const data = await res.json();

  if (!data.success || !data.data) {
    console.log('❌ Failed:', data.message || JSON.stringify(data));
    process.exit(1);
  }

  const cats = Array.isArray(data.data) ? data.data : [];
  console.log('✅ Got', cats.length, 'level-1 categories');

  let total = 0;

  for (const l1 of cats) {
    const l1Id = l1.categoryFirstId;
    const l1Name = l1.categoryFirstName || 'Unknown';
    if (!l1Id) { console.log('  ⚠️ L1 missing ID:', l1Name); continue; }

    // Upsert Level 1
    const l1Db = await prisma.category.upsert({
      where: { cjId: l1Id },
      update: { name: l1Name, slug: slugify(l1Name) },
      create: { cjId: l1Id, name: l1Name, slug: slugify(l1Name), parentId: null }
    });
    total++;
    console.log(`  📂 ${l1Name}`);

    const l2List = l1.categoryFirstList || [];
    for (const l2 of l2List) {
      const l2Id = l2.categorySecondId;
      const l2Name = l2.categorySecondName || 'Unknown';
      if (!l2Id) { console.log(`    ⚠️ L2 missing ID: ${l2Name}`); continue; }

      // Upsert Level 2
      const l2Db = await prisma.category.upsert({
        where: { cjId: l2Id },
        update: { name: l2Name, slug: slugify(l2Name), parentId: l1Db.id },
        create: { cjId: l2Id, name: l2Name, slug: slugify(l2Name), parentId: l1Db.id }
      });
      total++;
      console.log(`    📁 ${l2Name}`);

      const l3List = l2.categorySecondList || [];
      for (const l3 of l3List) {
        const l3Id = l3.categoryId;
        const l3Name = l3.categoryName || 'Unknown';
        if (!l3Id) { continue; }

        await prisma.category.upsert({
          where: { cjId: l3Id },
          update: { name: l3Name, slug: slugify(l3Name), parentId: l2Db.id },
          create: { cjId: l3Id, name: l3Name, slug: slugify(l3Name), parentId: l2Db.id }
        });
        total++;
      }
    }
  }

  const dbTotal = await prisma.category.count();
  console.log(`✅ Sync complete! ${total} categories synced, ${dbTotal} total in DB`);
  await prisma.$disconnect();
}

main().catch(e => { console.error('❌', e); process.exit(1); });
