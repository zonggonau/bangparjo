import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj-api';

/**
 * Import a product from CJ to our local database
 * POST /api/admin/import-product
 */
export async function POST(req: Request) {
  try {
    const { pid, isHero } = await req.json();

    if (!pid) {
      return NextResponse.json({ success: false, error: 'Product ID (pid) is required' }, { status: 400 });
    }

    // 1. Fetch full details from CJ
    const res = await getProductDetails(pid);
    if (!res.success || !res.data) {
      return NextResponse.json({ success: false, error: res.message || 'Failed to fetch product from CJ' }, { status: 500 });
    }

    const cjProduct = res.data;

    // Check if exists
    const existing = await prisma.product.findUnique({
      where: { cjId: pid },
      include: { variants: true }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { 
          isHero: !!isHero,
          cjCategoryId: cjProduct.categoryId || existing.cjCategoryId
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Product already exists. Updated metadata.', 
        product: { ...existing, isHero: !!isHero } 
      });
    }

    // Calculate summaries
    const variantCount = cjProduct.variants.length;
    const totalStock = 2000; // Default placeholder

    // Create product
    const product = await prisma.product.create({
      data: {
        cjId: pid,
        name: cjProduct.productNameEn || cjProduct.productName,
        description: cjProduct.description,
        images: cjProduct.productImageSet && cjProduct.productImageSet.length > 0 ? cjProduct.productImageSet : [cjProduct.productImage],
        cjCategoryId: cjProduct.categoryId || null,
        variantCount,
        totalStock,
        isHero: !!isHero,
        variants: {
          create: cjProduct.variants.map((v: any) => ({
            cjId: v.vid,
            sku: v.variantSku,
            color: v.variantKey || v.variantNameEn || v.variantName || 'Default',
            size: '', 
            weight: v.variantWeight || 0,
            baseCost: Number(v.variantSellPrice),
            sellingPrice: Number(v.variantSellPrice), 
            inventory: 100, 
            image: v.variantImage || cjProduct.productImage
          }))
        }
      },
      include: {
        variants: true
      }
    });

    return NextResponse.json({ success: true, product });

  } catch (error: any) {
    console.error('[Import Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
