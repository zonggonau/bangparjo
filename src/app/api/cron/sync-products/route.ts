import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cjFetch } from '@/lib/cj-api';

/**
 * Bulk Product Sync
 * This route iterates through all active products in our DB
 * and fetches their latest status and prices from CJ.
 */
export async function GET(req: Request) {
  // Simple auth check to prevent abuse
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all products from DB
    const products = await prisma.product.findMany({
      select: { cjId: true },
      where: { status: 'ACTIVE' },
    });

    if (products.length === 0) {
      return NextResponse.json({ message: 'No active products to sync' });
    }

    let updatedCount = 0;
    let deactivatedCount = 0;
    const priceChangedAlerts: any[] = [];

    // 2. Iterate and fetch product query from CJ
    // Note: We process sequentially to respect QPS limits,
    // cjFetch will handle QPS retries automatically
    for (const product of products) {
      if (!product.cjId) continue;

      const res = await cjFetch<any>('/v1/product/query', {
        method: 'GET',
        // Some CJ endpoints use query parameters, but cjFetch with body will parse it or we can pass it in URL
        // It's safer to pass pid in URL query string for GET request
      });

      // Actually, wait, cj-api.ts cjFetch logic says if it's GET it might use cjProxyAction.
      // Usually product/query takes ?pid=XXX
      const queryRes = await cjFetch<any>(`/v1/product/query?pid=${product.cjId}`, {
        method: 'GET',
      });

      if (queryRes.success && queryRes.data) {
        const cjProduct = queryRes.data;

        // 3. Update Product Status
        const newStatus = cjProduct.productType === '0' || cjProduct.status === 0 ? 'INACTIVE' : 'ACTIVE';
        if (newStatus === 'INACTIVE') {
          await prisma.product.update({
            where: { cjId: product.cjId },
            data: { status: 'INACTIVE' },
          });
          deactivatedCount++;
        }

        // 4. Update Variants Prices
        if (cjProduct.variants && Array.isArray(cjProduct.variants)) {
          for (const variant of cjProduct.variants) {
            const sellPrice = parseFloat(variant.variantSellPrice || cjProduct.sellPrice);
            
            // Get old base cost to compare
            const oldVariant = await prisma.variant.findFirst({
              where: { cjId: variant.vid },
              select: { baseCost: true, sku: true }
            });

            if (oldVariant && oldVariant.baseCost !== sellPrice) {
              await prisma.variant.update({
                where: { cjId: variant.vid },
                data: { baseCost: sellPrice },
              });
              
              // If price increased by more than 20%, trigger an alert
              if (sellPrice > oldVariant.baseCost * 1.2) {
                priceChangedAlerts.push({
                  sku: oldVariant.sku,
                  oldPrice: oldVariant.baseCost,
                  newPrice: sellPrice,
                });
              }
              updatedCount++;
            }
          }
        }
      } else {
        // Product might not exist in CJ anymore
        if (queryRes.message && queryRes.message.includes('not found')) {
          await prisma.product.update({
            where: { cjId: product.cjId },
            data: { status: 'INACTIVE' },
          });
          deactivatedCount++;
        }
      }
    }

    // 5. Send Alert if significant price changes
    if (priceChangedAlerts.length > 0) {
      try {
        const { sendCustomWA } = await import('@/lib/openclaw-client');
        const adminPhone = process.env.ADMIN_PHONE_NUMBER;
        if (adminPhone) {
          const message = [
            `⚠️ *CJ Product Price Alert*`,
            ``,
            `Some products have significant base cost increases (>20%):`,
            ...priceChangedAlerts.map(p => `- ${p.sku}: $${p.oldPrice} ➡️ *$${p.newPrice}*`),
            ``,
            `Please check your store pricing to ensure margins are maintained.`,
          ].join('\n');
          await sendCustomWA(adminPhone, message);
        }
      } catch (err) {
        console.warn('Failed to send price alert:', err);
      }
    }

    return NextResponse.json({
      success: true,
      processed: products.length,
      variantsUpdated: updatedCount,
      productsDeactivated: deactivatedCount,
    });
  } catch (error: any) {
    console.error('Products Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
