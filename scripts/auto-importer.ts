#!/usr/bin/env tsx
/**
 * 🤖 Auto Importer Bot — BangParjo Shop
 * 
 * Imports products from CJ Dropshipping API to local database.
 * Runs daily at 00:00 until daily QPS is exhausted, then resumes next day.
 * 
 * Features:
 * - Respects CJ API daily points limit (50000/day)
 * - Ships already-imported products (skip by cjId)
 * - Applies margin from PricingTier/MarginTier table
 * - Saves progress — resumes from where it stopped
 * - Detailed logging per session
 * 
 * Cron: 0 0 * * * (midnight daily)
 * Run:  cd /www/bangparjo && npx tsx scripts/auto-importer.ts >> logs/auto-importer.log 2>&1
 */

import { prisma } from '../src/lib/db';
import { getProducts, getProductDetails } from '../src/lib/cj-api';
import { getDBStoreSettings, applyMarginToPrice, StoreSettings } from '../src/lib/pricing';

// ── Constants ────────────────────────────────────────────────────────────
const DELAY_BETWEEN_PRODUCTS_MS = 1500;   // 1.5s delay between product detail calls
const DELAY_BETWEEN_PAGES_MS = 2000;       // 2s delay between page fetches
const PAGE_SIZE = 20;                       // Products per API page
const POINTS_SAFETY_MARGIN = 100;           // Stop when <100 points remaining to avoid mid-call exhaustion
const LOG_FILE = 'logs/auto-importer.log';

// ── State helpers ────────────────────────────────────────────────────────
interface ImportState {
  status: 'IDLE' | 'RUNNING' | 'ERROR' | 'COMPLETED';
  currentCategoryCjId: string | null;
  currentPage: number;
  productIndex: number;      // Index within current page (for resume mid-page)
  categoriesDone: string[];   // Array of completed category cjIds
  importedToday: number;
  skippedToday: number;
  lastRunDate: string;        // YYYY-MM-DD
  log: string[];               // Running log lines
}

function log(msg: string, state?: ImportState) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${ts}] ${msg}`;
  console.log(line);
  if (state) {
    state.log.push(line);
    if (state.log.length > 500) state.log.splice(0, 100); // Keep last 500
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── DB state persistence ────────────────────────────────────────────────
const STATE_PREFIX = 'IMPORTER_';

async function saveState(state: ImportState) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const kv: Record<string, string> = {
    [`${STATE_PREFIX}STATUS`]: state.status,
    [`${STATE_PREFIX}CURRENT_CATEGORY`]: state.currentCategoryCjId || '',
    [`${STATE_PREFIX}CURRENT_PAGE`]: String(state.currentPage),
    [`${STATE_PREFIX}PRODUCT_INDEX`]: String(state.productIndex),
    [`${STATE_PREFIX}CATEGORIES_DONE`]: JSON.stringify(state.categoriesDone),
    [`${STATE_PREFIX}IMPORTED_TODAY`]: String(state.importedToday),
    [`${STATE_PREFIX}SKIPPED_TODAY`]: String(state.skippedToday),
    [`${STATE_PREFIX}LAST_DATE`]: state.lastRunDate,
    [`${STATE_PREFIX}LOG`]: state.log.slice(-100).join('\n'),
  };

  for (const [key, value] of Object.entries(kv)) {
    await prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

async function loadState(): Promise<ImportState> {
  const keys = [
    `${STATE_PREFIX}STATUS`,
    `${STATE_PREFIX}CURRENT_CATEGORY`,
    `${STATE_PREFIX}CURRENT_PAGE`,
    `${STATE_PREFIX}PRODUCT_INDEX`,
    `${STATE_PREFIX}CATEGORIES_DONE`,
    `${STATE_PREFIX}IMPORTED_TODAY`,
    `${STATE_PREFIX}SKIPPED_TODAY`,
    `${STATE_PREFIX}LAST_DATE`,
    `${STATE_PREFIX}LOG`,
  ];

  const rows = await prisma.storeSetting.findMany({
    where: { key: { in: keys } },
  });

  const map = new Map(rows.map(r => [r.key, r.value]));

  return {
    status: (map.get(`${STATE_PREFIX}STATUS`) as any) || 'IDLE',
    currentCategoryCjId: map.get(`${STATE_PREFIX}CURRENT_CATEGORY`) || null,
    currentPage: parseInt(map.get(`${STATE_PREFIX}CURRENT_PAGE`) || '1'),
    productIndex: parseInt(map.get(`${STATE_PREFIX}PRODUCT_INDEX`) || '0'),
    categoriesDone: JSON.parse(map.get(`${STATE_PREFIX}CATEGORIES_DONE`) || '[]'),
    importedToday: parseInt(map.get(`${STATE_PREFIX}IMPORTED_TODAY`) || '0'),
    skippedToday: parseInt(map.get(`${STATE_PREFIX}SKIPPED_TODAY`) || '0'),
    lastRunDate: map.get(`${STATE_PREFIX}LAST_DATE`) || '',
    log: (map.get(`${STATE_PREFIX}LOG`) || '').split('\n').filter(Boolean),
  };
}

async function getCJPoints(): Promise<{ used: number; remaining: number; total: number }> {
  const rows = await prisma.storeSetting.findMany({
    where: { key: { in: ['CJ_POINTS_USED', 'CJ_POINTS_REMAINING', 'CJ_POINTS_TOTAL'] } },
  });
  const map = new Map(rows.map(r => [r.key, r.value]));
  return {
    used: parseInt(map.get('CJ_POINTS_USED') || '0'),
    remaining: parseInt(map.get('CJ_POINTS_REMAINING') || '50000'),
    total: parseInt(map.get('CJ_POINTS_TOTAL') || '50000'),
  };
}

// ── Product import logic ──────────────────────────────────────────────────
async function importProduct(
  pid: string,
  settings: StoreSettings,
  state: ImportState
): Promise<{ imported: boolean; pointsExhausted: boolean }> {
  // Check if already in DB
  const existing = await prisma.product.findUnique({ where: { cjId: pid } });
  if (existing) {
    state.skippedToday++;
    return { imported: false, pointsExhausted: false };
  }

  // Check remaining points before fetching
  const pts = await getCJPoints();
  if (pts.remaining < POINTS_SAFETY_MARGIN) {
    return { imported: false, pointsExhausted: true };
  }

  await sleep(DELAY_BETWEEN_PRODUCTS_MS);

  // Fetch product details
  const detail = await getProductDetails(pid);
  if (!detail.success || !detail.data) {
    log(`⚠️  Failed to fetch product ${pid}: ${detail.message || 'No data'}`, state);
    return { imported: false, pointsExhausted: false };
  }

  const d = detail.data;
  const images = d.productImageSet && d.productImageSet.length > 0 ? d.productImageSet : [];

  // Upsert product
  const product = await prisma.product.upsert({
    where: { cjId: d.pid },
    update: {
      name: d.productNameEn || d.productName,
      description: d.description || '',
      images: images,
      variantCount: d.variants?.length || 0,
      totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
      cjCategoryId: d.categoryId || null,
      updatedAt: new Date(),
    },
    create: {
      cjId: d.pid,
      name: d.productNameEn || d.productName,
      description: d.description || '',
      images: images,
      variantCount: d.variants?.length || 0,
      totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
      cjCategoryId: d.categoryId || null,
      status: 'ACTIVE',
    },
  });

  // Upsert variants with margin pricing
  if (d.variants?.length) {
    for (const v of d.variants) {
      const baseCost = Number(v.variantSellPrice || 0);
      await prisma.variant.upsert({
        where: { cjId: v.vid },
        update: {
          sku: v.variantSku,
          color: v.variantKey || '',
          size: v.variantNameEn || '',
          weight: v.variantWeight || 0,
          baseCost: baseCost,
          sellingPrice: applyMarginToPrice(baseCost, settings),
          inventory: v.inventory || 100,
          image: v.variantImage || d.productImage,
        },
        create: {
          productId: product.id,
          cjId: v.vid,
          sku: v.variantSku,
          color: v.variantKey || '',
          size: v.variantNameEn || '',
          weight: v.variantWeight || 0,
          baseCost: baseCost,
          sellingPrice: applyMarginToPrice(baseCost, settings),
          inventory: v.inventory || 100,
          image: v.variantImage || d.productImage,
        },
      });
    }
  }

  state.importedToday++;
  return { imported: true, pointsExhausted: false };
}

// ── Main bot loop ────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🤖 BANGPARJO AUTO IMPORTER BOT');
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════════\n');

  // Load state
  let state = await loadState();
  const today = new Date().toISOString().slice(0, 10);

  // If it's a new day, reset everything
  if (state.lastRunDate !== today) {
    log(`📅 New day ${today} — resetting counters (was ${state.lastRunDate || 'none'})`, state);
    state.importedToday = 0;
    state.skippedToday = 0;
    state.lastRunDate = today;
    state.status = 'IDLE';
    state.currentCategoryCjId = null;
    state.currentPage = 1;
    state.productIndex = 0;
    state.categoriesDone = [];
  } else if (state.status === 'RUNNING') {
    // Previous run crashed — treat as paused, resume from where we left off
    log(`⚠️  Previous run crashed (status=RUNNING). Resuming...`, state);
    state.status = 'IDLE';
  } else if (state.status === 'COMPLETED') {
    log('✅ All categories already imported today. Exiting.', state);
    console.log('\n✅ Bot exiting — all done for today.');
    return;
  }

  // Set running state
  state.status = 'RUNNING';
  await saveState(state);

  // Fetch margin settings once
  const settings = await getDBStoreSettings();

  // Get all leaf categories with cjId, ordered
  const categories = await prisma.category.findMany({
    where: {
      cjId: { not: null },
      // Prefer leaf categories (no children)
    },
    orderBy: [
      { parentId: 'asc' }, // L1 first, then L2, then L3
      { name: 'asc' },
    ],
  });

  log(`📦 Loaded ${categories.length} categories from DB`, state);
  log(`📋 ${state.importedToday} imported / ${state.skippedToday} skipped so far today`, state);

  let doneCount = state.categoriesDone.length;
  let pointsExhausted = false;

  for (const cat of categories) {
    if (!cat.cjId) continue;

    // Skip completed categories
    if (state.categoriesDone.includes(cat.cjId)) continue;

    // Check if running out of points
    if (!pointsExhausted) {
      const pts = await getCJPoints();
      if (pts.remaining < POINTS_SAFETY_MARGIN) {
        pointsExhausted = true;
        log(`⚠️  Points running low (${pts.remaining} remaining). Stopping for today.`, state);
        break;
      }
    }
    if (pointsExhausted) break;

    log(`📁 Category [${doneCount + 1}/${categories.length}]: ${cat.name} (${cat.cjId})`, state);
    state.currentCategoryCjId = cat.cjId;
    state.currentPage = (state.currentCategoryCjId === cat.cjId) ? state.currentPage : 1;
    state.productIndex = 0;
    await saveState(state);

    let page = state.currentCategoryCjId === cat.cjId ? state.currentPage : 1;
    let hasMore = true;
    let importedThisCat = 0;
    let skippedThisCat = 0;
    let apiErrorCount = 0;

    while (hasMore && !pointsExhausted) {
      log(`  📄 Page ${page}...`, state);

      try {
        const res = await getProducts({ pageNum: page, pageSize: PAGE_SIZE, categoryId: cat.cjId });

        if (!res.success) {
          log(`  ❌ API error: ${res.message || 'Unknown'}`, state);

          // Check if points exhausted
          if (res.message?.includes('POINTS_EXHAUSTED') || res.message?.includes('Insufficient CJ API')) {
            pointsExhausted = true;
            log(`  ⚠️  Points exhausted! Stopping.`, state);
            break;
          }

          apiErrorCount++;
          if (apiErrorCount >= 3) {
            log(`  ❌ Too many API errors (${apiErrorCount}). Moving to next category.`, state);
            break;
          }
          await sleep(5000);
          continue;
        }

        apiErrorCount = 0;

        if (!res.data?.list?.length) {
          log(`  ✅ No more products in this category.`, state);
          hasMore = false;
          break;
        }

        const totalProducts = res.data.total || 0;
        log(`  📦 ${res.data.list.length} products (total in cat: ${totalProducts})`, state);

        // Process products on this page
        for (let i = state.productIndex; i < res.data.list.length; i++) {
          const p = res.data.list[i];

          // Check points before each product
          if (i % 5 === 0) { // Check every 5 products
            const pts = await getCJPoints();
            if (pts.remaining < POINTS_SAFETY_MARGIN) {
              pointsExhausted = true;
              state.productIndex = i;
              log(`  ⚠️  Points ${pts.remaining} < ${POINTS_SAFETY_MARGIN} — pausing mid-page`, state);
              await saveState(state);
              break;
            }
          }
          if (pointsExhausted) break;

          const result = await importProduct(p.pid, settings, state);

          if (result.pointsExhausted) {
            pointsExhausted = true;
            state.productIndex = i;
            log(`  ⚠️  Points exhausted while importing product ${p.pid}`, state);
            await saveState(state);
            break;
          }

          if (result.imported) {
            importedThisCat++;
          } else {
            skippedThisCat++;
          }

          // Periodic state save every 10 products
          if ((state.importedToday + state.skippedToday) % 10 === 0) {
            await saveState(state);
          }
        }

        // Reset product index for next page
        state.productIndex = 0;
        state.currentPage = page + 1;
        await saveState(state);

        if (pointsExhausted) break;

        // If we got fewer than page size, no more pages
        if (res.data.list.length < PAGE_SIZE) {
          hasMore = false;
        }

        page++;
        await sleep(DELAY_BETWEEN_PAGES_MS);

      } catch (err: any) {
        if (err.message?.includes('POINTS_EXHAUSTED')) {
          pointsExhausted = true;
          log(`  ⚠️  Points exhausted (exception).`, state);
          break;
        }
        log(`  ❌ Error fetching page ${page}: ${err.message}`, state);
        apiErrorCount++;
        if (apiErrorCount >= 3) {
          log(`  ❌ Too many errors on ${cat.name}. Moving on.`, state);
          break;
        }
        await sleep(5000);
      }
    }

    if (!pointsExhausted && apiErrorCount < 3) {
      // Category completed
      state.categoriesDone.push(cat.cjId as string);
      doneCount++;
      log(`  ✅ Category "${cat.name}" done! +${importedThisCat} imported, ${skippedThisCat} skipped`, state);
    } else {
      log(`  ⏸️  Category "${cat.name}" paused (imported: ${importedThisCat}, skipped: ${skippedThisCat})`, state);

      // If we broke mid-category, save state and exit
      await saveState(state);
      break;
    }

    await saveState(state);
  }

  // Final state
  const pts = await getCJPoints();

  if (doneCount >= categories.length) {
    state.status = 'COMPLETED';
    state.currentCategoryCjId = null;
    state.currentPage = 1;
    state.productIndex = 0;
    log(`\n🎉 ALL DONE! ${state.importedToday} products imported, ${state.skippedToday} skipped today.`, state);
  } else if (pointsExhausted) {
    state.status = 'IDLE'; // Will resume next day at 00:00
    log(`\n⏸️  PAUSED — points exhausted. ${state.importedToday} imported today, ${doneCount}/${categories.length} categories done.`, state);
    log(`   Resume tomorrow at 00:00.`, state);
  } else {
    state.status = 'IDLE';
    log(`\n⏸️  PAUSED — ${doneCount}/${categories.length} categories done, ${state.importedToday} imported.`, state);
  }

  log(`📊 Points: ${pts.used}/${pts.total} used, ${pts.remaining} remaining`, state);
  await saveState(state);

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  📊 SUMMARY — ${new Date().toISOString()}`);
  console.log(`  Imported today : ${state.importedToday}`);
  console.log(`  Skipped (dup)  : ${state.skippedToday}`);
  console.log(`  Categories done: ${doneCount}/${categories.length}`);
  console.log(`  CJ Points used : ${pts.used}/${pts.total}`);
  console.log(`  Status         : ${state.status}`);
  console.log('═══════════════════════════════════════════════════\n');
}

main()
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    // Try to save error state
    prisma.storeSetting.upsert({
      where: { key: `${STATE_PREFIX}STATUS` },
      update: { value: 'ERROR' },
      create: { key: `${STATE_PREFIX}STATUS`, value: 'ERROR' },
    }).catch(() => {});
  })
  .finally(() => prisma.$disconnect());
