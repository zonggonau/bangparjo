import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Admin Bulk Import API
 * 
 * Handles bulk product imports from discovery scripts.
 * Pricing: sellingPrice = baseCost (harga CJ asli, tanpa markup).
 * Margin 35% akan diterapkan di checkout oleh calculateFinalPrice().
 * Keuntungan dari shipping (+$1).
 * 
 * POST /api/admin/bulk-import
 * Body: { products: Array<CJProductV2>, pageInfo: object }
 */

/** Extract minimum sell price from CJ price string ("5.31" or "1.76 -- 2.63") */
function parseMinPrice(sellPrice: string | undefined | null): number {
  if (!sellPrice) return 0;
  const cleaned = sellPrice.replace(/[^0-9.,\-–—\s]/g, '').trim();
  // Split on range separators
  const parts = cleaned.split(/\s*[-–—]\s*/);
  const first = parseFloat(parts[0].replace(/,/g, ''));
  return isNaN(first) ? 0 : first;
}

/** Parse weight range like "350.00-450.00" or "160.00" */
function parseMinWeight(weight: string | undefined | null): number {
  if (!weight) return 0;
  const parts = weight.split(/[-–—]/);
  const first = parseFloat(parts[0].trim());
  return isNaN(first) ? 0 : first;
}

export async function POST(req: Request) {
  try {
    const { products } = await req.json();

    if (!Array.isArray(products)) {
      return NextResponse.json({ success: false, error: 'products must be an array' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const p of products) {
      try {
        const pid = p.id || p.pid;
        if (!pid) {
          errors++;
          continue;
        }

        const existing = await prisma.product.findUnique({ where: { cjId: pid } });
        if (existing) {
          skipped++;
          continue;
        }

        // Extract pricing & weight from search result
        const basePrice = parseMinPrice(p.sellPrice as string);
        const baseWeight = parseMinWeight(p.productWeight as string);
        const productSku = p.productSku || `SKU-${pid.slice(-8)}`;

        // Step 1: Create product
        const product = await prisma.product.create({
          data: {
            cjId: pid,
            name: p.nameEn || p.name || 'Unknown Product',
            description: p.description || '',
            images: [p.bigImage || p.productImage].filter(Boolean),
            cjCategoryId: p.categoryId || null,
            status: 'ACTIVE',
            variantCount: 1,
            totalStock: 0,
          }
        });

        // Step 2: Create variant — sellingPrice = baseCost (sama persis)
        // Margin 35% diterapkan di checkout oleh calculateFinalPrice()
        // Profit dari shipping (+$1) diterapkan oleh calculateShippingFee()
        await prisma.variant.create({
          data: {
            productId: product.id,
            cjId: `${pid}-default`,
            sku: productSku,
            color: null,
            size: null,
            weight: baseWeight,
            baseCost: basePrice,
            sellingPrice: basePrice,
            inventory: 0,
            image: p.bigImage || p.productImage || null,
          }
        });

        imported++;

        console.log(`[Bulk Import] Created ${pid}: cost=${basePrice}, sell=${basePrice}, weight=${baseWeight}, sku=${productSku}`);
      } catch (err: any) {
        console.error(`[Bulk Import] Error importing ${p.id}:`, err.message);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        imported,
        skipped,
        errors,
        total: products.length
      }
    });
  } catch (error: any) {
    console.error('[Bulk Import API] Fatal Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
