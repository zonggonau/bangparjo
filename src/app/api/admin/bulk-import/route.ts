import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface ListV2Product {
  id: string;
  nameEn?: string;
  sku?: string;
  bigImage?: string;
  sellPrice?: string;
  nowPrice?: string;
  description?: string;
  categoryId?: string;
  threeCategoryName?: string;
  twoCategoryName?: string;
  oneCategoryName?: string;
  supplierName?: string;
  createAt?: number;
  warehouseInventoryNum?: number;
  variantInventories?: string;
  propertyKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { products, pageInfo } = await req.json();
    
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: false, error: 'No products provided' }, { status: 400 });
    }

    const results = { imported: 0, skipped: 0, errors: 0, details: [] as any[] };

    for (const p of products) {
      try {
        const pid = p.id || p.pid;
        if (!pid || pid.length < 5) {
          results.skipped++;
          continue;
        }

        // Check if already exists
        const existing = await prisma.product.findUnique({ where: { cjId: pid } });
        if (existing) {
          // Update categoryId if possible
          if (p.categoryId) {
            let cat = await prisma.category.findFirst({ where: { cjId: p.categoryId } });
            if (cat && existing.categoryId !== cat.id) {
              await prisma.product.update({ where: { id: existing.id }, data: { categoryId: cat.id } });
              results.details.push({ pid, name: p.nameEn || '', status: 'category updated', cat: cat.name });
              continue;
            }
          }
          results.skipped++;
          results.details.push({ pid, name: p.nameEn || '', status: 'skipped (exists)' });
          continue;
        }

        // Parse images
        const images: string[] = [];
        if (p.bigImage) images.push(p.bigImage);
        if (p.productImage && p.productImage !== p.bigImage) images.push(p.productImage);

        // Parse description
        const description = p.description || '';

        // Find or create category
        let categoryId = null;
        if (p.categoryId) {
          let cat = await prisma.category.findFirst({ where: { cjId: p.categoryId } });
          if (!cat) {
            cat = await prisma.category.create({
              data: {
                cjId: p.categoryId,
                name: p.threeCategoryName || p.twoCategoryName || p.oneCategoryName || 'Uncategorized',
                slug: (p.threeCategoryName || p.twoCategoryName || 'uncategorized').toLowerCase().replace(/\s+/g, '-'),
              }
            });
          }
          categoryId = cat.id;
        }

        // Get base price
        const basePrice = parseFloat(p.sellPrice || p.nowPrice || '0');
        const finalSellingPrice = isNaN(basePrice) ? 0 : basePrice;

        // Create product with basic data
        const product = await prisma.product.create({
          data: {
            cjId: pid,
            name: p.nameEn || 'Unknown Product',
            description: description,
            images: images.length > 0 ? images : ['/placeholder.png'],
            categoryId: categoryId,
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
            baseCost: finalSellingPrice,
            sellingPrice: finalSellingPrice,
            inventory: p.warehouseInventoryNum || 100,
            image: images[0] || null,
          }
        });

        results.imported++;
        results.details.push({ pid, name: p.nameEn || '', status: 'imported', price: finalSellingPrice });

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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
