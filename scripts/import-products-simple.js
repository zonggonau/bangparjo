#!/usr/bin/env node
/** Import products from CJ listV2 API — simple mode, no variants */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOKEN = "API@CJ162155@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNjIzNSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlnamZKd1JyUjRqVmZHSC9oRUI2UWpsS2dIRVhBRGJTL01PZUxHQlVyeEVHdGhiTmt3UHIrVU1FbGZReVNaV2d4WCtoQ0RLWUc5bmlVY25XSHJsUDRwa1VteW5uM3VqVnFObEVWU1l5TkpoYXp0UGp1VVFZY1JVUUZvaDBpUkNqRGVHRENDemNjSXo0NFZ6NmxGL3FnamxQZE1VamN2WVh5QVBQdEl2TEVWY1VwSmQyV1JQa0hGWmlhYkpoLzhrTzlWdkpCSXlrOWo3ait4ZGprbm5TVGVxSTgwZE81UW9wQXBMY3R2ZlZCYW5FbXh5ejZ6eElDbmdNVHFKTjNmVEgwbHdOZmhjK2ova0RYbzVZY1JHTUJjaUcvanVsMitTYldHT0VFZjlnY2pCQzNRcGZneHJYK3QxaUFFdkxwUG5Pc3c9PSIsImlhdCI6MTc4MDA1OTYyOX0.pId741NtLbgp8goF5vIq-iECXzpZICia0G-iWXPxGC0";

const CATEGORIES = [
  { cjId: "2FE8A083-5E7B-4179-896D-561EA116F730", name: "Women's Clothing" },
  { cjId: "B8302697-CF47-4211-9BD0-DFE8995AEB30", name: "Men's Clothing" },
  { cjId: "D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2", name: "Consumer Electronics" },
  { cjId: "2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902", name: "Health, Beauty & Hair" },
  { cjId: "6A5D2EB4-13BD-462E-A627-78CFED11B2A2", name: "Home Improvement" },
  { cjId: "52FC6CA5-669B-4D0B-B1AC-415675931399", name: "Home, Garden & Furniture" },
  { cjId: "1126E280-CB7D-418A-90AB-7118E2D97CCC", name: "Computer & Office" },
  { cjId: "2415A90C-5D7B-4CC7-BA8C-C0949F9FF5D8", name: "Bags & Shoes" },
  { cjId: "2837816E-2FEA-4455-845C-6F40C6D70D1E", name: "Jewelry & Watches" },
  { cjId: "2409110611570657700", name: "Pet Supplies" },
  { cjId: "E9FDC79A-8365-4CA6-AC23-64D971F08B8B", name: "Phones & Accessories" },
  { cjId: "4B397425-26C1-4D0E-B6D2-96B0B03689DB", name: "Sports & Outdoors" },
  { cjId: "A50A92FA-BCB3-4716-9BD9-BEC629BEE735", name: "Toys, Kids & Babies" },
  { cjId: "A2F799BE-FB59-428E-A953-296AA2673FCF", name: "Automobiles & Motorcycles" },
];

const MIN_INTERVAL = 5000; // 5s between API calls
let lastReq = 0;

async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, lastReq + MIN_INTERVAL - now);
  lastReq = now + wait;
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
}

async function cjFetch(path) {
  await throttle();
  const url = `https://developers.cjdropshipping.com/api2.0${path}`;
  const res = await fetch(url, { headers: { 'CJ-Access-Token': TOKEN } });
  return res.json();
}

async function main() {
  // Clear existing products
  await prisma.product.deleteMany();
  console.log('Cleared existing products');

  let total = 0;
  for (const cat of CATEGORIES) {
    let page = 1;
    let catTotal = 0;

    while (true) {
      const data = await cjFetch(`/v1/product/listV2?categoryId=${cat.cjId}&page=${page}&size=20&features=enable_description`);
      const products = data?.data?.content?.[0]?.productList || [];
      if (products.length === 0) break;

      for (const p of products) {
        const pid = String(p.id || '');
        if (!pid) continue;

        try {
          await prisma.product.create({
            data: {
              cjId: pid,
              name: p.nameEn || p.productName || 'Unknown',
              description: p.description || '',
              images: [p.bigImage || p.productImage || ''].filter(Boolean),
              cjCategoryId: p.categoryId || cat.cjId,
              status: 'ACTIVE',
              isHero: false,
              variantCount: 1,
              totalStock: 999,
            }
          });
          catTotal++;
          process.stdout.write('.');
        } catch (e) {
          if (e.code === 'P2002') process.stdout.write('s'); // skip duplicate
          else process.stdout.write('x');
        }
      }
      console.log(` [${cat.name}] Page ${page}: ${products.length} products`);
      page++;
    }
    total += catTotal;
    console.log(`  → ${catTotal} products imported`);
  }

  const count = await prisma.product.count();
  console.log(`\n✅ Done! Total: ${count} products`);
  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
