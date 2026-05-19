import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj-api';

export async function POST(req: Request) {
  try {
    const { pid } = await req.json();
    if (!pid) return NextResponse.json({ success: false, error: 'PID is required' }, { status: 400 });

    // 1. Get latest from CJ
    const res = await getProductDetails(pid);
    if (!res.success || !res.data) {
      return NextResponse.json({ success: false, error: res.message || 'Failed to fetch from CJ' }, { status: 500 });
    }

    const cjProduct = res.data;

    // 2. Update Product & Variants in DB
    const updatedProduct = await prisma.product.update({
      where: { cjId: pid },
      data: {
        name: cjProduct.productNameEn || cjProduct.productName,
        description: cjProduct.description,
        images: cjProduct.productImageSet && cjProduct.productImageSet.length > 0 ? cjProduct.productImageSet : [cjProduct.productImage],
        cjCategoryId: cjProduct.categoryId || undefined,
        updatedAt: new Date()
      }
    });

    // Update variants
    const variantOperations = cjProduct.variants.map(v => {
      const baseCost = Number(v.variantSellPrice);
      
      return prisma.variant.upsert({
        where: { cjId: v.vid },
        update: {
          inventory: 100, // CJ API often doesn't give real-time stock here
          baseCost,
          sellingPrice: baseCost,
          sku: v.variantSku,
          weight: v.variantWeight || 0,
          image: v.variantImage || cjProduct.productImage
        },
        create: {
          cjId: v.vid,
          productId: updatedProduct.id,
          sku: v.variantSku,
          color: v.variantKey || v.variantNameEn || 'Default',
          size: '',
          inventory: 100,
          baseCost,
          sellingPrice: baseCost,
          weight: v.variantWeight || 0,
          image: v.variantImage || cjProduct.productImage
        }
      });
    });

    await Promise.all(variantOperations);

    const latestVariants = await prisma.variant.findMany({
      where: { productId: updatedProduct.id },
      orderBy: { inventory: 'asc' }
    });

    return NextResponse.json({ success: true, data: { variants: latestVariants } });

  } catch (error: any) {
    console.error('[Sync Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
