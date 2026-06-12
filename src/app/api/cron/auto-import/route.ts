import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductsV2, cjFetch } from '@/lib/cj-api';
import { getDBStoreSettings, applyMarginToPrice } from '@/lib/pricing';
import { resolveCategoryId } from '@/lib/actions-catalog';

/**
 * Fetch variants dari CJ untuk suatu produk.
 * Returns array variant atau null kalo gagal (QPS limit, dll)
 */
async function fetchVariants(pid: string) {
  try {
    const res = await cjFetch<any[]>(`/api2.0/v1/product/variant/query?pid=${pid}`);
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch {
    // QPS limit atau error lain — skip variant
  }
  return null;
}

// GET /api/cron/auto-import?reset=1&categoryId=...
// Auto-import produk dari CJ berdasarkan kategori (level-1 parent category).
// Setiap produk akan langsung masuk ke subkategori masing-masing.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || '';
    const reset = searchParams.get('reset');
    
    // 1. Get or create current state
    let state = await (prisma as any).autoImportState.findFirst({
      where: { id: 'default' }
    });

    if (reset === '1') {
       state = await (prisma as any).autoImportState.upsert({
         where: { id: 'default' },
         update: { currentPage: 1, currentCategory: categoryId, status: 'RUNNING' },
         create: { id: 'default', currentPage: 1, currentCategory: categoryId, status: 'RUNNING' }
       });
    }

    if (!state) {
       state = await (prisma as any).autoImportState.create({
         data: { id: 'default', currentPage: 1, currentCategory: categoryId, status: 'RUNNING' }
       });
    }

    if (state.status === 'COMPLETED' && reset !== '1') {
       return NextResponse.json({ success: true, message: 'Auto-import is fully completed. Pass ?reset=1 to restart.' });
    }

    // 2. Fetch page from CJ API
    const page = state.currentPage;
    const size = 10;

    const res = await getProductsV2({
       categoryId: state.currentCategory || undefined,
       page,
       size,
       features: ['enable_description'],
    });

    if (!res.success || !res.data) {
       return NextResponse.json({ success: false, error: 'Failed to fetch from CJ API' });
    }

    const rawProducts = res.data.content?.[0]?.productList || [];
    const totalRecords = res.data.totalRecords || 0;

    if (rawProducts.length === 0) {
       await (prisma as any).autoImportState.update({
          where: { id: 'default' },
          data: { status: 'COMPLETED' }
       });
       return NextResponse.json({ success: true, message: 'No more products found. Import completed.' });
    }

    // 3. Process products one by one
    let successCount = 0;
    let failCount = 0;
    let variantFailedCount = 0;
    const settings = await getDBStoreSettings();

    for (const p of rawProducts) {
      try {
        const pid = p.id || (p as any).pid;
        if (!pid) { failCount++; continue; }

        const resolvedCatId = await resolveCategoryId(p.categoryId || p.twoCategoryId || p.oneCategoryId);

        // ── Attempt to fetch full details + variants ──
        let variantData: any[] | null = null;
        try {
          const detailRes = await cjFetch<any>(`/api2.0/v1/product/query?pid=${pid}`);
          if (detailRes.success && detailRes.data) {
            const d = detailRes.data;
            
            // Build image list from full details
            const detailImages: string[] = [];
            if (d.productImageSet && Array.isArray(d.productImageSet)) {
              for (const img of d.productImageSet) {
                if (img && !detailImages.includes(img)) detailImages.push(img);
              }
            }
            if (detailImages.length === 0 && d.bigImage) detailImages.push(d.bigImage);

            const imageList = detailImages.length > 0 ? detailImages : (p.bigImage ? [p.bigImage] : []);
            const nameEn = d.productNameEn || d.productName || p.nameEn || 'Unknown';
            const desc = d.description || p.description || '';

            // Get variants
            const rawVariants = (d.variants && Array.isArray(d.variants)) ? d.variants : [];

            // Cek existing
            const existing = await prisma.product.findUnique({ where: { cjId: pid } });

            if (existing) {
              await prisma.product.update({
                where: { id: existing.id },
                data: {
                  name: nameEn, description: desc,
                  images: imageList.length > 0 ? imageList : existing.images,
                  status: 'ACTIVE',
                  categoryId: resolvedCatId || existing.categoryId,
                  cjCategoryId: d.categoryId || p.categoryId || null,
                  variantCount: rawVariants.length,
                  totalStock: rawVariants.length * 100,
                  updatedAt: new Date(),
                }
              });

              // Re-create variants
              if (rawVariants.length > 0) {
                await prisma.variant.deleteMany({ where: { productId: existing.id } });
                for (const v of rawVariants) {
                  const vCost = parseFloat(String(v.variantSellPrice || '0')) || 0;
                  await prisma.variant.create({
                    data: {
                      productId: existing.id, cjId: v.vid,
                      sku: v.variantSku || '',
                      color: v.variantValue1 || v.variantNameEn || 'Default',
                      size: v.variantValue2 || '',
                      weight: v.variantWeight || 0,
                      baseCost: vCost,
                      sellingPrice: applyMarginToPrice(vCost, settings),
                      inventory: v.inventory || 100,
                      image: v.variantImage || d.bigImage || imageList[0] || ''
                    }
                  });
                }
              }

              successCount++;
            } else {
              // Create new product with full details + variants
              await prisma.product.create({
                data: {
                  cjId: pid, name: nameEn, description: desc, images: imageList,
                  cjCategoryId: d.categoryId || p.categoryId || null,
                  categoryId: resolvedCatId,
                  variantCount: rawVariants.length,
                  totalStock: rawVariants.length * 100,
                  isHero: false, status: 'ACTIVE',
                  variants: rawVariants.length > 0 ? {
                    create: rawVariants.map((v: any) => {
                      const vCost = parseFloat(String(v.variantSellPrice || '0')) || 0;
                      return {
                        cjId: v.vid, sku: v.variantSku || '',
                        color: v.variantValue1 || v.variantNameEn || 'Default',
                        size: v.variantValue2 || '', weight: v.variantWeight || 0,
                        baseCost: vCost,
                        sellingPrice: applyMarginToPrice(vCost, settings),
                        inventory: v.inventory || 100,
                        image: v.variantImage || d.bigImage || imageList[0] || ''
                      };
                    })
                  } : undefined
                }
              });

              successCount++;
            }
          } else {
            // Fallback: save from V2 listing data without variants
            throw new Error('detail fetch failed');
          }
        } catch (detailErr) {
          // ── Fallback: save from V2 listing (no variants) ──
          const imageList = p.bigImage ? [p.bigImage] : [];
          const existing = await prisma.product.findUnique({ where: { cjId: pid } });
          
          if (existing) {
            await prisma.product.update({
              where: { id: existing.id },
              data: {
                name: p.nameEn || existing.name,
                images: p.bigImage ? [p.bigImage] : existing.images,
                status: 'ACTIVE',
                categoryId: resolvedCatId || existing.categoryId,
                cjCategoryId: p.categoryId || p.twoCategoryId || null,
                updatedAt: new Date(),
              }
            });
          } else {
            await prisma.product.create({
              data: {
                cjId: pid, name: p.nameEn || 'Unknown', description: p.description || '',
                images: imageList,
                cjCategoryId: p.categoryId || p.twoCategoryId || null,
                categoryId: resolvedCatId,
                variantCount: 0, totalStock: 0, isHero: false, status: 'ACTIVE',
              }
            });
          }
          variantFailedCount++;
          successCount++;
        }

        // Delay 2.5s antar produk
        await new Promise(resolve => setTimeout(resolve, 2500));
      } catch (e: any) {
        console.warn(`[AutoImport] Gagal import produk ${p.id}: ${e.message}`);
        failCount++;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // 4. Update state for next run
    await (prisma as any).autoImportState.update({
       where: { id: 'default' },
       data: { currentPage: page + 1, status: 'RUNNING' }
    });

    const variantNote = variantFailedCount > 0 
      ? ` (${variantFailedCount} tanpa variant — QPS limit)` 
      : '';

    return NextResponse.json({ 
       success: true, 
       message: `Page ${page}: ${successCount} sukses${variantNote}, ${failCount} gagal. Total ${totalRecords} produk.`,
       nextPage: page + 1,
       totalCJRecords: totalRecords
    });
  } catch (error: any) {
    console.error('[AutoImport Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
