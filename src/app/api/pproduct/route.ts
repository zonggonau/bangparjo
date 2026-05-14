import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cjId = searchParams.get('cjId');
  if (!cjId) return NextResponse.json({ success: false, message: 'Missing cjId' }, { status: 400 });
  
  try {
    const product = await prisma.product.findUnique({
      where: { cjId },
      include: { variants: true }
    });
    if (!product) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    
    return NextResponse.json({
      success: true,
      data: {
        pid: product.cjId,
        productName: product.name,
        productNameEn: product.name,
        productImage: product.images?.[0] || '',
        bigImage: product.images?.[0] || '',
        sellPrice: product.variants?.[0]?.baseCost || 0,
        variants: product.variants.map(v => ({
          vid: v.cjId,
          variantNameEn: [v.color, v.size].filter(Boolean).join(' / ') || 'Default',
          variantSellPrice: v.sellingPrice,
          variantSku: v.sku,
          variantWeight: v.weight,
          inventory: v.inventory,
          variantImage: v.image || '',
          variantKey: [v.color, v.size].filter(Boolean).join(' - ') || 'default',
        })),
      }
    });
  } catch (error: any) {
    console.error('[Product API] Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
