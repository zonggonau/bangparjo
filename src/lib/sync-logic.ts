import { prisma } from '@/lib/db';
import { getCategories, getProducts, getProductDetails, slugify } from '@/lib/cj-api';
import { setCache } from './cj-api'; // Re-use the cache setter

const DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Refreshes the category cache in Redis.
 * We no longer sync to the DB primary category table for frontend navigation.
 */
export async function syncAllCategories() {
  console.log('📦 Refreshing category cache...');
  const res = await getCategories();
  
  if (res.success && res.data) {
     // Force update the cache (1 week)
     await setCache('cj_category_tree_v2', res, 604800);
     return Array.isArray(res.data) ? res.data.length : 1;
  }
  
  throw new Error(`Failed to refresh categories: ${res.message}`);
}

export async function syncTrendingProducts(maxPages = 1) {
  console.log(`📦 Syncing trending products (${maxPages} pages)...`);
  let imported = 0;
  
  for (let page = 1; page <= maxPages; page++) {
    // searchType: 2 is trending
    const res = await getProducts({ pageNum: page, pageSize: 20, searchType: 2 });
    if (!res.success || !res.data?.list?.length) break;

    for (const p of res.data.list) {
      try {
        await sleep(DELAY_MS);
        const detail = await getProductDetails(p.pid);
        if (!detail.success || !detail.data) continue;

        const d = detail.data;
        
        // We store the CJ Category ID directly in the Product record
        // instead of relying on a DB-level relation for display
        const product = await prisma.product.upsert({
          where: { cjId: d.pid },
          update: {
            name: d.productNameEn || d.productName,
            description: d.description || '',
            images: d.productImageSet && d.productImageSet.length > 0 ? d.productImageSet : [d.productImage],
            variantCount: d.variants?.length || 0,
            totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
            cjCategoryId: d.categoryId || null, // Store CJ ID string
            updatedAt: new Date()
          },
          create: {
            cjId: d.pid,
            name: d.productNameEn || d.productName,
            description: d.description || '',
            images: d.productImageSet && d.productImageSet.length > 0 ? d.productImageSet : [d.productImage],
            variantCount: d.variants?.length || 0,
            totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
            cjCategoryId: d.categoryId || null,
            status: 'ACTIVE'
          }
        });

        if (d.variants?.length) {
          // Delete old variants to ensure clean update if they are not in orders
          // For simplicity in sync-logic, we update or create.
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
                sellingPrice: baseCost, // Frontend applies margin
                inventory: v.inventory || 100,
                image: v.variantImage || d.productImage
              },
              create: {
                productId: product.id,
                cjId: v.vid,
                sku: v.variantSku,
                color: v.variantKey || '',
                size: v.variantNameEn || '',
                weight: v.variantWeight || 0,
                baseCost: baseCost,
                sellingPrice: baseCost,
                inventory: v.inventory || 100,
                image: v.variantImage || d.productImage
              }
            });
          }
        }
        imported++;
      } catch (err) {
        console.error(`Failed to sync product ${p.pid}:`, err);
      }
    }
  }
  return imported;
}

export async function startCategoryImport(cjId: string) {
  // Set state to RUNNING
  await prisma.autoImportState.upsert({
    where: { id: "default" },
    update: { currentCategory: cjId, currentPage: 1, status: "RUNNING", updatedAt: new Date() },
    create: { id: "default", currentCategory: cjId, currentPage: 1, status: "RUNNING" }
  });

  // Start background task (floating promise)
  (async () => {
    console.log(`Starting background import for category ${cjId}`);
    try {
      let page = 1;
      let hasMore = true;
      let imported = 0;

      while (hasMore) {
        // Check if status was manually stopped
        const state = await prisma.autoImportState.findUnique({ where: { id: "default" } });
        if (state?.status !== "RUNNING" || state?.currentCategory !== cjId) {
          console.log(`Import stopped or category changed for ${cjId}`);
          break;
        }
<<<<<<< HEAD

        // Fetch products by category from CJ API
        const res = await getProducts({ pageNum: page, pageSize: 20, categoryId: cjId });
        if (!res.success || !res.data?.list?.length) {
          hasMore = false;
          break;
        }

        for (const p of res.data.list) {
          try {
            await sleep(DELAY_MS);
            const detail = await getProductDetails(p.pid);
            if (!detail.success || !detail.data) continue;

            const d = detail.data;

            // Import product only — no variants
            await prisma.product.upsert({
              where: { cjId: d.pid },
              update: {
                name: d.productNameEn || d.productName,
                description: d.description || '',
                images: d.productImageSet && d.productImageSet.length > 0 ? d.productImageSet : [d.productImage],
                variantCount: d.variants?.length || 0,
                totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
                cjCategoryId: d.categoryId || null,
                updatedAt: new Date()
              },
              create: {
                cjId: d.pid,
                name: d.productNameEn || d.productName,
                description: d.description || '',
                images: d.productImageSet && d.productImageSet.length > 0 ? d.productImageSet : [d.productImage],
                variantCount: d.variants?.length || 0,
                totalStock: d.variants?.reduce((a: number, v: any) => a + (v.inventory || 0), 0) || 0,
                cjCategoryId: d.categoryId || null,
                status: 'ACTIVE'
              }
            });

            imported++;
          } catch (err) {
            console.error(`Failed to import product ${p.pid}:`, err);
          }
        }

=======
>>>>>>> 1f9e4a4cb81d46741ac16caa2a39597d452e5d6a
        page++;
        // Update state to next page
        await prisma.autoImportState.update({
          where: { id: "default" },
          data: { currentPage: page }
        });
      }

<<<<<<< HEAD
      console.log(`✅ Import finished for category ${cjId} — ${imported} products imported`);
=======
      console.log(`Import finished for category ${cjId}`);
>>>>>>> 1f9e4a4cb81d46741ac16caa2a39597d452e5d6a
      await prisma.autoImportState.update({
        where: { id: "default" },
        data: { status: "IDLE", currentCategory: null }
      });
    } catch (err) {
      console.error(`Background import error:`, err);
      await prisma.autoImportState.update({
        where: { id: "default" },
        data: { status: "ERROR" }
      });
    }
  })(); // fire and forget
}
