import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  const excludeId = searchParams.get('exclude'); // cjId to exclude

  try {
    let products;

    if (categoryId) {
      // Fetch products from same category, exclude the current product
      products = await prisma.product.findMany({
        where: {
          categoryId: categoryId,
          status: 'ACTIVE',
          ...(excludeId ? { cjId: { not: excludeId } } : {}),
        },
        include: {
          category: true,
          variants: true,
        },
        take: 21,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Fallback: random products
      products = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: { category: true, variants: true },
        take: 21,
        orderBy: { createdAt: 'desc' },
      });
    }

    // Map to the same format that ProductCard expects
    const list = products.map(p => ({
      pid: p.cjId,
      productName: p.name,
      productNameEn: p.name,
      productImage: p.images[0] || '/placeholder.png',
      bigImage: p.images[0] || '/placeholder.png',
      productImageSet: p.images,
      sellPrice: p.variants?.[0]?.sellingPrice || 0,
      categoryName: p.category?.name || 'Uncategorized',
      categoryId: p.categoryId,
    }));

    return NextResponse.json({ success: true, data: { list } });
  } catch (error: any) {
    console.error('[API] Related products error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
