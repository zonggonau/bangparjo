#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TOKEN = "API@CJ162155@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNjIzNSIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlnamZKd1JyUjRqVmZHSC9oRUI2UWpsS2dIRVhBRGJTL01PZUxHQlVyeEVHdGhiTmt3UHIrVU1FbGZReVNaV2d4ZXdEVGo2cEJOdmRtbStTOGJHYnVIdzdiOUgrSktIY0tsUGl3b2FUTCtTWHp0UGp1VVFZY1JVUUZvaDBpUkNqRGVHRENDemNjSXo0NFZ6NmxGL3FnamxQZE1VamN2WVh5QVBQdEl2TEVWY1VwSmQyV1JQa0hGWmlhYkpoLzhrTzlWdkpCSXlrOWo3ait4ZGprbm5TVGVxSTgwZE81UW9wQXBMY3R2ZlZCYW5FbXh5ejZ6eElDbmdNVHFKTjNmVEgwbHdOZmhjK2ova0RYbzVZY1JHTUJjaUcvanVsMitTYldHT0VFZjlnY2pCQzNRcGZneHJYK3QxaUFFdkxwUG5Pc3c9PSIsImlhdCI6MTc4MDQwODgzMH0.LYmhhrj3xHeLH3hsSn4f37q_DPRBE_EkbuyEX1kfReU";

const CATS = [
  { cj: "B8302697-CF47-4211-9BD0-DFE8995AEB30", name: "Men's Clothing" },
  { cj: "D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2", name: "Consumer Electronics" },
  { cj: "2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902", name: "Health, Beauty & Hair" },
  { cj: "6A5D2EB4-13BD-462E-A627-78CFED11B2A2", name: "Home Improvement" },
  { cj: "52FC6CA5-669B-4D0B-B1AC-415675931399", name: "Home, Garden & Furniture" },
  { cj: "1126E280-CB7D-418A-90AB-7118E2D97CCC", name: "Computer & Office" },
  { cj: "2415A90C-5D7B-4CC7-BA8C-C0949F9FF5D8", name: "Bags & Shoes" },
  { cj: "2837816E-2FEA-4455-845C-6F40C6D70D1E", name: "Jewelry & Watches" },
  { cj: "2409110611570657700", name: "Pet Supplies" },
  { cj: "E9FDC79A-8365-4CA6-AC23-64D971F08B8B", name: "Phones & Accessories" },
  { cj: "4B397425-26C1-4D0E-B6D2-96B0B03689DB", name: "Sports & Outdoors" },
  { cj: "A50A92FA-BCB3-4716-9BD9-BEC629BEE735", name: "Toys, Kids & Babies" },
  { cj: "A2F799BE-FB59-428E-A953-296AA2673FCF", name: "Automobiles & Motorcycles" },
];

let lastReq = 0;
async function cjFetch(path) {
  const wait = Math.max(0, lastReq + 8000 - Date.now());
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastReq = Date.now();
  const res = await fetch("https://developers.cjdropshipping.com/api2.0" + path, { headers: { "CJ-Access-Token": TOKEN } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

async function main() {
  let total = 0;
  for (const cat of CATS) {
    let page = 1;
    while (true) {
      const data = await cjFetch("/v1/product/listV2?categoryId=" + cat.cj + "&page=" + page + "&size=20");
      const products = data?.data?.content?.[0]?.productList || [];
      if (products.length === 0) break;

      for (const p of products) {
        try {
          const pid = String(p.id || "");
          if (!pid) continue;
          const existing = await prisma.product.findUnique({ where: { cjId: pid } });
          if (existing) continue;
          await prisma.product.create({
            data: { cjId: pid, name: p.nameEn || "Unknown", images: [p.bigImage || ""].filter(Boolean), cjCategoryId: p.categoryId || cat.cj, status: "ACTIVE", variantCount: 1, totalStock: 999 }
          });
          total++; process.stdout.write(".");
        } catch(e) { process.stdout.write("x"); }
      }
      console.log(" [" + cat.name + "] Page " + page + " (" + total + " total)");
      page++;
    }
  }
  const count = await prisma.product.count();
  console.log("\n✅ Done! Total: " + count + " products");
  await prisma.$disconnect();
}

main().catch(e => { console.error("Fatal:", e.message); prisma.$disconnect().then(() => process.exit(1)); });
