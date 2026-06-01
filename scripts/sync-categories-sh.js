#!/usr/bin/env node
/** Fetch CJ categories, output SQL, pipe via psql */
const TOKEN = "API@CJ162155@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNjIzNSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlnamZKd1JyUjRqVmZHSC9oRUI2UWpsS2dIRVhBRGJTL01PZUxHQlVyeEVHdGhiTmt3UHIrVU1FbGZReVNaV2d4WCtoQ0RLWUc5bmlVY25XSHJsUDRwa1VteW5uM3VqVnFObEVWU1l5TkpoYXp0UGp1VVFZY1JVUUZvaDBpUkNqRGVHRENDemNjSXo0NFZ6NmxGL3FnamxQZE1VamN2WVh5QVBQdEl2TEVWY1VwSmQyV1JQa0hGWmlhYkpoLzhrTzlWdkpCSXlrOWo3ait4ZGprbm5TVGVxSTgwZE81UW9wQXBMY3R2ZlZCYW5FbXh5ejZ6eElDbmdNVHFKTjNmVEgwbHdOZmhjK2ova0RYbzVZY1JHTUJjaUcvanVsMitTYldHT0VFZjlnY2pCQzNRcGZneHJYK3QxaUFFdkxwUG5Pc3c9PSIsImlhdCI6MTc4MDA1OTYyOX0.pId741NtLbgp8goF5vIq-iECXzpZICia0G-iWXPxGC0";

function slugify(text, suffix) {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + suffix;
}

function esc(v) { return "'" + (v || '').replace(/'/g, "''") + "'"; }

async function main() {
  const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/getCategory', {
    headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': TOKEN }
  });
  const data = await res.json();
  if (!data.success || !data.data) throw new Error(data.message || 'API failed');

  const cats = data.data;
  console.error(`Got ${cats.length} level-1 categories, generating SQL...`);

  let sql = 'TRUNCATE "Category" CASCADE;\n';
  let total = 0;

  for (const l1 of cats) {
    const l1Id = l1.categoryFirstId;
    const l1Name = l1.categoryFirstName || 'Unknown';
    if (!l1Id) continue;
    const l1Slug = slugify(l1Name, l1Id);
    sql += `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt") `;
    sql += `VALUES (gen_random_uuid()::text, ${esc(l1Id)}, ${esc(l1Name)}, ${esc(l1Slug)}, NULL, NOW(), NOW());\n`;
    total++;
    console.error(`  ${l1Name}`);

    for (const l2 of (l1.categoryFirstList || [])) {
      const l2Id = l2.categorySecondId;
      const l2Name = l2.categorySecondName || 'Unknown';
      if (!l2Id) continue;
      const l2Slug = slugify(l2Name, l2Id);
      sql += `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt") `;
      sql += `VALUES (gen_random_uuid()::text, ${esc(l2Id)}, ${esc(l2Name)}, ${esc(l2Slug)}, (SELECT id FROM "Category" WHERE "cjId"=${esc(l1Id)}), NOW(), NOW());\n`;
      total++;

      for (const l3 of (l2.categorySecondList || [])) {
        const l3Id = l3.categoryId;
        const l3Name = l3.categoryName || 'Unknown';
        if (!l3Id) continue;
        const l3Slug = slugify(l3Name, l3Id);
        sql += `INSERT INTO "Category" (id, "cjId", name, slug, "parentId", "createdAt", "updatedAt") `;
        sql += `VALUES (gen_random_uuid()::text, ${esc(l3Id)}, ${esc(l3Name)}, ${esc(l3Slug)}, (SELECT id FROM "Category" WHERE "cjId"=${esc(l2Id)}), NOW(), NOW());\n`;
        total++;
      }
    }
  }

  // Output SQL to stdout
  process.stdout.write(sql);
  console.error(`Done! ${total} SQL insert statements generated`);
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
