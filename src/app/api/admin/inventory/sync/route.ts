import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj-api';
import { getDBStoreSettings, calculateFinalPrice } from '@/lib/pricing';

export async function POST(req: Request) {
  try {
    const { pid } = await req.json();
    if (!pid) return NextResponse.json({ error: 'PID is required' }, { status: 400 });

    // 1. Get latest from CJ
    const res = await getProductDetails(pid);
    if (!res.success || !res.data) {
      return NextResponse.json({ error: 'Failed to fetch from CJ' }, { status: 500 });
    }

    const cjProduct = res.data;
    const settings = await getDBStoreSettings();

    // 2. Update Product & Variants in DB
    const updatedProduct = await prisma.product.update({
      where: { cjId: pid },
      data: {
        name: cjProduct.productNameEn || cjProduct.productName,
        description: cjProduct.description,
        images: cjProduct.productImageSet || [cjProduct.productImage],
      }
    });

    // Update variants (Upsert or replace)
    // For simplicity, we'll update existing and create missing ones
    const variantOperations = cjProduct.variants.map(v => {
      const baseCost = Number(v.variantSellPrice);
      const sellingPrice = baseCost; // Use base cost, frontend will apply dynamic margin

      return prisma.variant.upsert({
        where: { cjId: v.vid },
        update: {
          inventory: 100, // CJ API v1 often doesn't give real-time stock in query, but we assume 100 for now
          baseCost,
          sellingPrice,
          sku: v.variantSku,
          weight: v.variantWeight || 0
        },
        create: {
          cjId: v.vid,
          productId: updatedProduct.id,
          sku: v.variantSku,
          color: v.variantKey || v.variantNameEn || 'Default',
          size: '',
          inventory: 100,
          baseCost,
          sellingPrice,
          weight: v.variantWeight || 0
        }
      });
    });

    await Promise.all(variantOperations);

    const latestVariants = await prisma.variant.findMany({
      where: { productId: updatedProduct.id },
      orderBy: { inventory: 'asc' }
    });

    return NextResponse.json({ success: true, variants: latestVariants });

  } catch (error: any) {
    console.error('[Sync Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
