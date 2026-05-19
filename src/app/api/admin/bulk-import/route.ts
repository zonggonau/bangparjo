import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { products } = await req.json();
    
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, error: 'No products provided' }, { status: 400 });
    }

    const results = { imported: 0, skipped: 0, errors: 0, details: [] as any[] };

    for (const p of products) {
      try {
        const pid = p.id || p.pid;
        if (!pid) {
          results.skipped++;
          continue;
        }

        // Check if already exists
        const existing = await prisma.product.findUnique({ where: { cjId: pid } });
        if (existing) {
          // Sync category ID if provided
          if (p.categoryId && existing.cjCategoryId !== p.categoryId) {
             await prisma.product.update({
               where: { id: existing.id },
               data: { cjCategoryId: p.categoryId }
             });
          }
          results.skipped++;
          results.details.push({ pid, name: p.nameEn || '', status: 'skipped (exists)' });
          continue;
        }

        // Parse images
        const images: string[] = [];
        if (p.bigImage) images.push(p.bigImage);
        if (p.productImage && p.productImage !== p.bigImage) images.push(p.productImage);
        if (images.length === 0) images.push('/placeholder.png');

        // Get base price
        const basePrice = parseFloat(p.sellPrice || p.nowPrice || '0');
        const finalPrice = isNaN(basePrice) ? 0 : basePrice;

        // Create product
        const product = await prisma.product.create({
          data: {
            cjId: pid,
            name: p.nameEn || 'Unknown Product',
            description: p.description || '',
            images: images,
            cjCategoryId: p.categoryId || null,
            variantCount: 1,
            totalStock: p.warehouseInventoryNum || 100,
            status: 'ACTIVE',
            isHero: false,
          }
        });

        // Create a default variant
        await prisma.variant.create({
          data: {
            productId: product.id,
            cjId: pid + '-default',
            sku: p.sku || `SKU-${pid}`,
            color: '',
            size: '',
            weight: 0,
            baseCost: finalPrice,
            sellingPrice: finalPrice,
            inventory: p.warehouseInventoryNum || 100,
            image: images[0],
          }
        });

        results.imported++;
        results.details.push({ pid, name: p.nameEn || '', status: 'imported' });

      } catch (err: any) {
        results.errors++;
        results.details.push({ pid: p.id || '?', name: p.nameEn || '', status: 'error', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: products.length,
        imported: results.imported,
        skipped: results.skipped,
        errors: results.errors,
        details: results.details,
      }
    });

  } catch (error: any) {
    console.error('[Bulk Import Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
