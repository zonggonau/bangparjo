import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cjFetch } from '@/lib/cj';

/**
 * Bulk Inventory Sync
 * This route iterates through all products/variants in our DB
 * and fetches their latest stock levels from CJ.
 */
export async function GET(req: Request) {
  // Simple auth check (e.g. secret header) to prevent abuse
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const variants = await prisma.variant.findMany({
      select: { cjId: true }
    });

    if (variants.length === 0) {
      return NextResponse.json({ message: 'No variants to sync' });
    }

    // CJ stock API usually supports multiple VIDs in one call or we can call one by one.
    // Recommended: v1/storage/getVariantInventory?variantIds=ID1,ID2
    const vids = variants.map(v => v.cjId).filter(Boolean);
    
    // Process in chunks of 50 to avoid URL length limits
    const chunkSize = 50;
    let updatedCount = 0;

    for (let i = 0; i < vids.length; i += chunkSize) {
      const chunk = vids.slice(i, i + chunkSize);
      const res = await cjFetch<any>(`/v1/storage/getVariantInventory?variantIds=${chunk.join(',')}`);

      if (res.success && res.data) {
        // Iterate through response and update DB
        for (const item of res.data) {
          const totalStock = item.inventoryList?.reduce((sum: number, w: any) => sum + (w.inventoryNum || 0), 0) || 0;
          
          await prisma.variant.update({
            where: { cjId: item.variantId },
            data: { inventory: totalStock }
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: vids.length,
      updated: updatedCount 
    });

  } catch (error: any) {
    console.error('Inventory Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
