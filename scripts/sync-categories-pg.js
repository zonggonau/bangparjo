#!/usr/bin/env node
/** Sync CJ categories using pg (node-postgres) — bypasses Prisma unique validation */
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Z0ngg0n4U@localhost:5432/bangparjo_shop' });

const TOKEN = "API@CJ162155@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNjIzNSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlnamZKd1JyUjRqVmZHSC9oRUI2UWpsS2dIRVhBRGJTL01PZUxHQlVyeEVHdGhiTmt3UHIrVU1FbGZReVNaV2d4WCtoQ0RLWUc5bmlVY25XSHJsUDRwa1VteW5uM3VqVnFObEVWU1l5TkpoYXp0UGp1VVFZY1JVUUZvaDBpUkNqRGVHRENDemNjSXo0NFZ6NmxGL3FnamxQZE1VamN2WVh5QVBQdEl2TEVWY1VwSmQyV1JQa0hGWmlhYkpoLzhrTzlWdkpCSXlrOWo3ait4ZGprbm5TVGVxSTgwZE81UW9wQXBMY3R2ZlZCYW5FbXh5ejZ6eElDbmdNVHFKTjNmVEgwbHdOZmhjK2ova0RYbzVZY1JHTUJjaUcvanVsMitTYldHT0VFZjlnY2pCQzNRcGZneHJYK3QxaUFFdkxwUG5Pc3c9PSIsImlhdCI6MTc4MDA1OTYyOX0.pId741NtLbgp8goF5vIq-iECXzpZICia0G-iWXPxGC0";

function slugify(text, suffix) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + suffix;
}

async function main() {
  console.log('Fetching categories from CJ API...');
  const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/getCategory', {
    headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': TOKEN }
  });
  const data = await res.json();
  if (!data.success || !data.data) throw new Error(data.message || 'API failed');
  
  const cats = data.data;
  console.log(`Got ${cats.length} level-1 categories`);
  
  const client = await pool.connect();
  try {
    await client.query('TRUNCATE "Category" CASCADE');
    
    let total = 0;
    for (const l1 of cats) {
      const l1Id = l1.categoryFirstId;
      const l1Name = l1.categoryFirstName || 'Unknown';
      if (!l1Id) continue;
      
      const l1Slug = slugify(l1Name, l1Id);
      const { rows: [l1r] } = await client.query(
        `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NULL, NOW(), NOW()) RETURNING id`,
        [l1Id, l1Name, l1Slug]
      );
      total++;
      console.log(`  ${l1Name} (${l1Slug})`);
      
      for (const l2 of (l1.categoryFirstList || [])) {
        const l2Id = l2.categorySecondId;
        const l2Name = l2.categorySecondName || 'Unknown';
        if (!l2Id) continue;
        const l2Slug = slugify(l2Name, l2Id);
        
        const { rows: [l2r] } = await client.query(
          `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
          [l2Id, l2Name, l2Slug, l1r.id]
        );
        total++;
        
        for (const l3 of (l2.categorySecondList || [])) {
          const l3Id = l3.categoryId;
          const l3Name = l3.categoryName || 'Unknown';
          if (!l3Id) continue;
          const l3Slug = slugify(l3Name, l3Id);
          
          await client.query(
            `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt")
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())`,
            [l3Id, l3Name, l3Slug, l2r.id]
          );
          total++;
        }
      }
    }
    
    const { rows: [{ count }] } = await client.query('SELECT COUNT(*)::int as count FROM "Category"');
    console.log(`Done! ${total} categories synced, ${count} total in DB`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
