import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductsV2 } from '@/lib/cj-api';
import { resolveCategoryId } from '@/lib/actions-catalog';

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

    for (const p of rawProducts) {
      try {
        const pid = p.id || (p as any).pid;
        if (!pid) { failCount++; continue; }

        // Resolve kategori: coba dari categoryId (level-3), fallback ke twoCategoryId, lalu oneCategoryId
        const resolvedCatId = await resolveCategoryId(p.categoryId || p.twoCategoryId || p.oneCategoryId);

        // Cek apakah produk sudah ada
        const existing = await prisma.product.findUnique({ where: { cjId: pid } });
        if (existing) {
          // Update produk existing dari data listing V2
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
          successCount++;
        } else {
          // Buat produk baru dari data listing V2 (tanpa panggil getProductDetails CJ)
          const imageList = p.bigImage ? [p.bigImage] : [];

          await prisma.product.create({
            data: {
              cjId: pid,
              name: p.nameEn || 'Unknown',
              description: p.description || '',
              images: imageList,
              cjCategoryId: p.categoryId || p.twoCategoryId || null,
              categoryId: resolvedCatId,
              variantCount: 0,
              totalStock: 0,
              isHero: false,
              status: 'ACTIVE',
            }
          });
          successCount++;
        }

        // Delay 2.5s antar produk untuk hindari QPS limit CJ
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

    return NextResponse.json({ 
       success: true, 
       message: `Page ${page}: ${successCount} sukses, ${failCount} gagal. Total ${totalRecords} produk di kategori.`,
       nextPage: page + 1,
       totalCJRecords: totalRecords
    });
  } catch (error: any) {
    console.error('[AutoImport Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
