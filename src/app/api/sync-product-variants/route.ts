import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj';
import { revalidateTag } from 'next/cache';
import { auth } from '@/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pid = searchParams.get('pid');

    if (!pid) {
      return NextResponse.json({ success: false, error: 'pid is required' }, { status: 400 });
    }

    // 1. Fetch product from DB to ensure it exists
    const product = await prisma.product.findUnique({
      where: { cjId: pid },
      include: { variants: true }
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found in DB' }, { status: 404 });
    }

    // 2. Fetch full details from CJ
    const res = await getProductDetails(pid);
    if (!res.success || !res.data) {
      return NextResponse.json({ success: false, error: res.message || 'Failed to fetch from CJ' }, { status: 500 });
    }

    const cjProduct = res.data;
    const variantCount = cjProduct.variants?.length || 0;
    
    // 3. Delete existing variants (including the default one)
    await prisma.variant.deleteMany({
      where: { productId: product.id }
    });

    // 4. Create real variants
    if (variantCount > 0) {
      await prisma.variant.createMany({
        data: cjProduct.variants.map((v) => ({
          productId: product.id,
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
      });
    }

    // 5. Update product with full details
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        description: cjProduct.description || product.description,
        images: cjProduct.productImageSet && cjProduct.productImageSet.length > 0 
                ? cjProduct.productImageSet 
                : [cjProduct.productImage || product.images[0]],
        variantCount,
        totalStock: 2000,
        status: 'ACTIVE'
      }
    });

    try {
      revalidateTag('home:featured', { expire: 0 });
      revalidateTag('home:bestsellers', { expire: 0 });
      revalidateTag('home:categories', { expire: 0 });
    } catch(e) {}

    return NextResponse.json({ success: true, message: 'Variants synced successfully' });
  } catch (error: any) {
    console.error('[Sync Variants Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
