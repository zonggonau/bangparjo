#!/usr/bin/env node
/** Import products from all CJ categories (no variants, no API timeout limits) */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CJ_API_KEY = "CJ162155@api@87abcf5b70ba4323a29a3124fa4872d9";
const CJ_TOKEN = "API@CJ162155@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNjIzNSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlnamZKd1JyUjRqVmZHSC9oRUI2UWpsS2dIRVhBRGJTL01PZUxHQlVyeEVHdGhiTmt3UHIrVU1FbGZReVNaV2d4WCtoQ0RLWUc5bmlVY25XSHJsUDRwa1VteW5uM3VqVnFObEVWU1l5TkpoYXp0UGp1VVFZY1JVUUZvaDBpUkNqRGVHRENDemNjSXo0NFZ6NmxGL3FnamxQZE1VamN2WVh5QVBQdEl2TEVWY1VwSmQyV1JQa0hGWmlhYkpoLzhrTzlWdkpCSXlrOWo3ait4ZGprbm5TVGVxSTgwZE81UW9wQXBMY3R2ZlZCYW5FbXh5ejZ6eElDbmdNVHFKTjNmVEgwbHdOZmhjK2ova0RYbzVZY1JHTUJjaUcvanVsMitTYldHT0VFZjlnY2pCQzNRcGZneHJYK3QxaUFFdkxwUG5Pc3c9PSIsImlhdCI6MTc4MDA1OTYyOX0.pId741NtLbgp8goF5vIq-iECXzpZICia0G-iWXPxGC0";

const CATEGORIES = [
  { id: "2FE8A083-5E7B-4179-896D-561EA116F730", name: "Women's Clothing" },
  { id: "B8302697-CF47-4211-9BD0-DFE8995AEB30", name: "Men's Clothing" },
  { id: "D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2", name: "Consumer Electronics" },
  { id: "2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902", name: "Health, Beauty & Hair" },
  { id: "6A5D2EB4-13BD-462E-A627-78CFED11B2A2", name: "Home Improvement" },
  { id: "52FC6CA5-669B-4D0B-B1AC-415675931399", name: "Home, Garden & Furniture" },
  { id: "1126E280-CB7D-418A-90AB-7118E2D97CCC", name: "Computer & Office" },
  { id: "2415A90C-5D7B-4CC7-BA8C-C0949F9FF5D8", name: "Bags & Shoes" },
  { id: "2837816E-2FEA-4455-845C-6F40C6D70D1E", name: "Jewelry & Watches" },
  { id: "2409110611570657700", name: "Pet Supplies" },
  { id: "E9FDC79A-8365-4CA6-AC23-64D971F08B8B", name: "Phones & Accessories" },
  { id: "4B397425-26C1-4D0E-B6D2-96B0B03689DB", name: "Sports & Outdoors" },
  { id: "A50A92FA-BCB3-4716-9BD9-BEC629BEE735", name: "Toys, Kids & Babies" },
  { id: "A2F799BE-FB59-428E-A953-296AA2673FCF", name: "Automobiles & Motorcycles" },
];

async function fetchCJ(endpoint, params = {}) {
  const url = new URL(`https://developers.cjdropshipping.com/api2.0${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { 'CJ-Access-Token': CJ_TOKEN, 'Content-Type': 'application/json' }
  });
  return res.json();
}

async function importProduct(cjProduct) {
  const pid = cjProduct.id || cjProduct.pid;
  if (!pid) return { success: false, error: 'no pid' };

  try {
    // Check if already exists
    const existing = await prisma.product.findUnique({ where: { cjId: String(pid) } });
    if (existing) return { success: true, skipped: true };

    // Get product detail
    const detail = await fetchCJ('/v1/product/getProductDetail', { pid });
    if (!detail.success || !detail.data) return { success: false, error: 'detail failed' };

    const p = detail.data;
    const images = (p.productImages || []).map(i => i.imageUrl || i).filter(Boolean);
    const firstPrice = p.productVariants?.[0]?.sellPrice || p.sellPrice || '0';

    const category = await prisma.category.findFirst({
      where: {
        OR: [
          ...(p.firstCategoryId ? [{ cjId: p.firstCategoryId }] : []),
          ...(p.secondCategoryId ? [{ cjId: p.secondCategoryId }] : []),
          ...(p.thirdCategoryId ? [{ cjId: p.thirdCategoryId }] : []),
        ]
      }
    });

    await prisma.product.create({
      data: {
        cjId: String(pid),
        name: p.productNameEn || p.productName || 'Unknown',
        description: p.productDesc || '',
        images,
        price: Number(firstPrice) || 0,
        retailPrice: Number(firstPrice) * 2.5 || 0,
        categoryId: category?.id || null,
        cjCategoryId: p.firstCategoryId || null,
        shipping: JSON.stringify({ weight: p.productWeight }),
        status: 'ACTIVE',
        weight: Number(p.productWeight) || 0,
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function main() {
  // Reset import state
  await prisma.autoImportState.deleteMany();
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const cat of CATEGORIES) {
    console.log(`\n=== ${cat.name} ===`);
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetchCJ('/v1/product/listV2', {
        categoryId: cat.id,
        page, size: 20,
        features: 'enable_description'
      });

      const products = res.data?.content?.[0]?.productList || [];
      if (products.length === 0) { hasMore = false; break; }

      for (const p of products) {
        const result = await importProduct(p);
        if (result.success && result.skipped) { totalSkipped++; }
        else if (result.success) { totalImported++; }
        else { totalFailed++; }

        if (result.success && !result.skipped) {
          process.stdout.write('.');
        }
        await new Promise(r => setTimeout(r, 1500)); // CJ rate limit
      }

      console.log(` Page ${page}: +${products.length} products`);
      page++;
    }
  }

  console.log(`\n\n✅ Done! Imported: ${totalImported}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
