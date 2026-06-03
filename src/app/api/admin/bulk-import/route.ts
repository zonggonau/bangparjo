import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { getDBStoreSettings, applyMarginToPrice } from '@/lib/pricing';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const apiKey = req.headers.get('x-scripts-api-key');
    const validApiKey = process.env.SCRIPTS_API_KEY && apiKey === process.env.SCRIPTS_API_KEY;

    if (session?.user?.role !== 'ADMIN' && !validApiKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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

        // Step 2: Create variant — sellingPrice dihitung dengan margin dari DB
        // Margin sekarang diterapkan pada saat import, bukan di client
        const settings = await getDBStoreSettings();
        const sellingPrice = applyMarginToPrice(basePrice, settings);

        await prisma.variant.create({
          data: {
            productId: product.id,
            cjId: `${pid}-default`,
            sku: productSku,
            color: null,
            size: null,
            weight: baseWeight,
            baseCost: basePrice,
            sellingPrice: sellingPrice,
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

function parseMinPrice(priceStr: string | null | undefined): number {
  if (!priceStr) return 0;
  const clean = String(priceStr).replace(/[$\s]/g, '');
  const parts = clean.split('-');
  const minVal = parseFloat(parts[0]);
  return isNaN(minVal) ? 0 : minVal;
}

function parseMinWeight(weightStr: string | number | null | undefined): number {
  if (weightStr == null) return 0;
  if (typeof weightStr === 'number') return weightStr;
  const clean = String(weightStr).replace(/[^\d.-]/g, '');
  const parts = clean.split('-');
  const minVal = parseFloat(parts[0]);
  return isNaN(minVal) ? 0 : minVal;
}

