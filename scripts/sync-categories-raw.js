#!/usr/bin/env node
/** Sync CJ categories directly with raw SQL — no Prisma unique constraint issues */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const token = "API@CJ162155@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNjIzNSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlnamZKd1JyUjRqVmZHSC9oRUI2UWpsS2dIRVhBRGJTL01PZUxHQlVyeEVHdGhiTmt3UHIrVU1FbGZReVNaV2d4WCtoQ0RLWUc5bmlVY25XSHJsUDRwa1VteW5uM3VqVnFObEVWU1l5TkpoYXp0UGp1VVFZY1JVUUZvaDBpUkNqRGVHRENDemNjSXo0NFZ6NmxGL3FnamxQZE1VamN2WVh5QVBQdEl2TEVWY1VwSmQyV1JQa0hGWmlhYkpoLzhrTzlWdkpCSXlrOWo3ait4ZGprbm5TVGVxSTgwZE81UW9wQXBMY3R2ZlZCYW5FbXh5ejZ6eElDbmdNVHFKTjNmVEgwbHdOZmhjK2ova0RYbzVZY1JHTUJjaUcvanVsMitTYldHT0VFZjlnY2pCQzNRcGZneHJYK3QxaUFFdkxwUG5Pc3c9PSIsImlhdCI6MTc4MDA1OTYyOX0.pId741NtLbgp8goF5vIq-iECXzpZICia0G-iWXPxGC0";

  console.log('Fetching categories from CJ API...');
  const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/getCategory', {
    headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token }
  });
  const data = await res.json();
  if (!data.success || !data.data) throw new Error(data.message || 'API failed');
  
  const cats = data.data;
  console.log(`Got ${cats.length} level-1 categories`);
  let total = 0;

  // Clear existing
  await prisma.$executeRawUnsafe(`TRUNCATE "Category" CASCADE`);

  for (const l1 of cats) {
    const l1Id = l1.categoryFirstId;
    const l1Name = l1.categoryFirstName || 'Unknown';
    if (!l1Id) continue;

    // Insert L1 via raw SQL to bypass Prisma unique validation
    const l1 = await prisma.$queryRawUnsafe(
      `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, NULL, NOW(), NOW()) RETURNING id`,
      l1Id, l1Name, l1Name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + l1Id
    );
    const l1IdDb = l1[0].id;
    total++;
    console.log(`  ${l1Name}`);

    for (const l2 of (l1.categoryFirstList || [])) {
      const l2Id = l2.categorySecondId;
      const l2Name = l2.categorySecondName || 'Unknown';
      if (!l2Id) continue;

      const l2Slug = l1Name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + l2Name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const l2r = await prisma.$queryRawUnsafe(
        `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
        l2Id, l2Name, l2Slug, l1IdDb
      );
      const l2IdDb = l2r[0].id;
      total++;
      console.log(`    ${l2Name}`);

      for (const l3 of (l2.categorySecondList || [])) {
        const l3Id = l3.categoryId;
        const l3Name = l3.categoryName || 'Unknown';
        if (!l3Id) continue;

        const l3Slug = l2Slug + '-' + l3Name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await prisma.$queryRawUnsafe(
          `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
          l3Id, l3Name, l3Slug, l2IdDb
        );
        total++;
      }
    }
  }

  const count = await prisma.category.count();
  console.log(`Done! ${total} categories synced, ${count} total in DB`);
  await prisma.$disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
