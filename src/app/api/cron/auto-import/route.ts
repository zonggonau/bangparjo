import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductsV2 } from '@/lib/cj-api';
import { importProductAction } from '@/lib/actions-admin-inventory';

// GET /api/cron/auto-import?categoryId=...&reset=1
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') || '';
    const reset = searchParams.get('reset');
    
    // 1. Get or create current state
    let state = await (prisma as any).autoImportState.findFirst({
      where: { id: 'default' }
    });

    if (reset === '1' && state) {
       state = await (prisma as any).autoImportState.update({
          where: { id: 'default' },
          data: { currentPage: 1, currentCategory: categoryId, status: 'RUNNING' }
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
    const size = 10; // 10 products per batch to avoid timeouts

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
       // Completed!
       await (prisma as any).autoImportState.update({
          where: { id: 'default' },
          data: { status: 'COMPLETED' }
       });
       return NextResponse.json({ success: true, message: 'No more products found. Import completed.' });
    }

    // 3. Process products one by one with a small delay
    let successCount = 0;
    let failCount = 0;

    for (const p of rawProducts) {
       try {
          const pid = p.id || (p as any).pid;
          if (pid) {
             const importRes = await importProductAction(pid, false);
             if (importRes.success) {
               successCount++;
             } else {
               failCount++;
             }
          }
          // Sleep 1500ms between imports to absolutely avoid CJ rate limit (HTTP 429)
          await new Promise(resolve => setTimeout(resolve, 1500));
       } catch (e) {
          failCount++;
       }
    }

    // 4. Update state for next run
    await (prisma as any).autoImportState.update({
       where: { id: 'default' },
       data: { currentPage: page + 1, status: 'RUNNING' }
    });

    return NextResponse.json({ 
       success: true, 
       message: `Batch processed: Page ${page}. Success: ${successCount}, Failed: ${failCount}.`,
       nextPage: page + 1,
       totalCJRecords: totalRecords
    });
  } catch (error: any) {
    console.error('[AutoImport Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
