/**
 * Script: Import produk dari CJ berdasarkan PID / SKU / URL
 * 
 * Cara pakai:
 *   npx tsx scripts/import-product.ts <PID1> [PID2] ...
 *   npx tsx scripts/import-product.ts --sku <SKU1> [SKU2]
 *   npx tsx scripts/import-product.ts <URL1> [URL2]
 *
 * Sesuai permintaan Crist: kirim ID, SKU, atau link → auto import
 */

import { prisma } from '@/lib/db';
import { getProductDetails, cjFetch } from '@/lib/cj-api';
import { getDBStoreSettings, applyMarginToPrice } from '@/lib/pricing';
import { resolveCategoryId } from '@/lib/actions-catalog';

// ─── Parse input ──────────────────────────────────────────────────────────
function parseArgs(): { pids: string[], skus: string[] } {
  const args = process.argv.slice(2);
  const pids: string[] = [];
  const skus: string[] = [];
  let mode: 'pid' | 'sku' | 'auto' = 'auto';

  for (const arg of args) {
    if (arg === '--sku' || arg === '-s') { mode = 'sku'; continue; }
    if (arg === '--pid' || arg === '-p') { mode = 'pid'; continue; }
    if (arg === '--help' || arg === '-h') continue;

    if (mode === 'sku') {
      skus.push(arg);
    } else if (mode === 'pid') {
      pids.push(arg);
    } else {
      // URL → extract PID
      if (arg.includes('cjdropshipping.com/product/')) {
        const match = arg.match(/p-(\d+)\.html/);
        if (match) { pids.push(match[1]); console.log(`  🔗 URL → PID: ${match[1]}`); }
        else { console.log(`  ⚠️  Tidak bisa extract PID dari URL: ${arg}`); }
      }
      // Numeric 19+ digit = PID
      else if (/^\d{19,}$/.test(arg.trim())) { pids.push(arg.trim()); }
      // Diawali CJ = SKU
      else if (/^CJ/i.test(arg.trim())) { skus.push(arg.trim()); }
      else { pids.push(arg.trim()); }
    }
  }
  return { pids, skus };
}

// ─── Fetch by PID ─────────────────────────────────────────────────────────
async function fetchByPid(pid: string) {
  console.log(`  🔍 Fetch PID: ${pid}`);
  try {
    const res = await getProductDetails(pid);
    if (res.success && res.data) return res.data;
    console.log(`  ❌ PID ${pid}: ${res.message || 'Not found'}`);
    return null;
  } catch (e: any) {
    console.log(`  ❌ PID ${pid}: ${e.message}`);
    return null;
  }
}

// ─── Fetch by SKU ─────────────────────────────────────────────────────────
async function fetchBySku(sku: string) {
  console.log(`  🔍 Fetch SKU: ${sku}`);
  try {
    const res = await cjFetch<any>(`/api2.0/v1/product/listV2?keyWord=${encodeURIComponent(sku)}&page=1&size=5`);
    if (res.success && res.data?.content?.[0]?.productList?.length > 0) {
      const products = res.data.content[0].productList;
      const match = products.find((p: any) => p.sku === sku || p.id === sku);
      if (match) {
        console.log(`  ✅ SKU match: ${match.nameEn} (${match.id})`);
        return await fetchByPid(match.id);
      }
      console.log(`  ⚠️  SKU '${sku}' tidak exact match. Produk mirip:`);
      for (const p of products) {
        console.log(`     - ${p.id}: ${p.nameEn} (SKU: ${p.sku})`);
      }
      return null;
    }
    console.log(`  ❌ SKU ${sku}: Tidak ditemukan`);
    return null;
  } catch (e: any) {
    console.log(`  ❌ SKU ${sku}: ${e.message}`);
    return null;
  }
}

// ─── Import ke DB ─────────────────────────────────────────────────────────
async function importProduct(p: any): Promise<boolean> {
  try {
    const pid = p.pid || p.id;
    if (!pid) return false;

    const resolvedCatId = await resolveCategoryId(p.categoryId);
    const nameEn = p.productNameEn || p.productName || 'Unknown';
    
    const imageList: string[] = [];
    if (p.productImageSet && Array.isArray(p.productImageSet)) {
      for (const img of p.productImageSet) {
        if (img && !imageList.includes(img)) imageList.push(img);
      }
    }
    if (imageList.length === 0 && p.bigImage) imageList.push(p.bigImage);
    if (imageList.length === 0 && p.productImage) {
      try {
        const parsed = JSON.parse(p.productImage);
        if (Array.isArray(parsed)) parsed.forEach(i => { if(i && !imageList.includes(i)) imageList.push(i); });
      } catch {}
    }

    const settings = await getDBStoreSettings();
    const existing = await prisma.product.findUnique({ where: { cjId: pid } });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: nameEn,
          description: p.description || existing.description,
          images: imageList.length > 0 ? imageList : existing.images,
          status: 'ACTIVE',
          categoryId: resolvedCatId || existing.categoryId,
          cjCategoryId: p.categoryId || null,
          variantCount: p.variants?.length || existing.variantCount,
          totalStock: (p.variants?.length || 0) * 100,
          updatedAt: new Date(),
        }
      });
      if (p.variants?.length) {
        await prisma.variant.deleteMany({ where: { productId: existing.id } });
        for (const v of p.variants) {
          const vCost = parseFloat(String(v.variantSellPrice || '0')) || 0;
          await prisma.variant.create({
            data: {
              productId: existing.id, cjId: v.vid,
              sku: v.variantSku || '', color: v.variantValue1 || v.variantNameEn || 'Default',
              size: v.variantValue2 || '', weight: v.variantWeight || 0,
              baseCost: vCost, sellingPrice: applyMarginToPrice(vCost, settings),
              inventory: v.inventory || 100,
              image: v.variantImage || p.bigImage || imageList[0] || ''
            }
          });
        }
      }
      console.log(`  ✅ UPDATE: ${nameEn} (${p.variants?.length || '?'} varian)`);
    } else {
      await prisma.product.create({
        data: {
          cjId: pid, name: nameEn, description: p.description || '', images: imageList,
          cjCategoryId: p.categoryId || null, categoryId: resolvedCatId,
          variantCount: p.variants?.length || 0, totalStock: (p.variants?.length || 0) * 100,
          isHero: false, status: 'ACTIVE',
          variants: p.variants?.length ? {
            create: p.variants.map((v: any) => {
              const vCost = parseFloat(String(v.variantSellPrice || '0')) || 0;
              return {
                cjId: v.vid, sku: v.variantSku || '',
                color: v.variantValue1 || v.variantNameEn || 'Default',
                size: v.variantValue2 || '', weight: v.variantWeight || 0,
                baseCost: vCost, sellingPrice: applyMarginToPrice(vCost, settings),
                inventory: v.inventory || 100,
                image: v.variantImage || p.bigImage || imageList[0] || ''
              };
            })
          } : undefined
        }
      });
      console.log(`  ✅ CREATE: ${nameEn} (${p.variants?.length || 0} varian)`);
    }
    return true;
  } catch (e: any) {
    console.log(`  ❌ Gagal import: ${e.message}`);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const { pids, skus } = parseArgs();

  if (pids.length === 0 && skus.length === 0) {
    console.log(`\n📦 IMPORT PRODUK CJ — BangParjo Shop`);
    console.log(`=====================================`);
    console.log(`Cara pakai:`);
    console.log(`  npx tsx scripts/import-product.ts <PID1> [PID2] ...`);
    console.log(`  npx tsx scripts/import-product.ts --sku <SKU1> [SKU2]`);
    console.log(`  npx tsx scripts/import-product.ts <URL1> [URL2]`);
    console.log(``);
    console.log(`Auto-detect: PID (19 digit), SKU (CJ...), atau URL → extract PID`);
    await prisma.$disconnect();
    return;
  }

  console.log(`📦 Import: ${pids.length} PID + ${skus.length} SKU\n`);

  const allData: any[] = [];
  for (const pid of pids) {
    const data = await fetchByPid(pid);
    if (data) allData.push(data);
  }
  for (const sku of skus) {
    const data = await fetchBySku(sku);
    if (data) allData.push(data);
  }

  if (allData.length === 0) {
    console.log('\n❌ Tidak ada produk yang ditemukan.');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n📥 Mengimport ${allData.length} produk...`);
  let success = 0;
  for (const data of allData) {
    if (await importProduct(data)) success++;
  }

  await prisma.$disconnect();
  console.log(`\n✅ Selesai! ${success}/${allData.length} berhasil.`);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  prisma.$disconnect();
});
