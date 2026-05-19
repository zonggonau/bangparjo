import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProductDetails } from '@/lib/cj-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cjId = searchParams.get('cjId');
  if (!cjId) return NextResponse.json({ success: false, message: 'Missing cjId' }, { status: 400 });
  
  try {
    let product: any = await prisma.product.findUnique({
      where: { cjId },
      include: { variants: true }
    });

    if (!product) {
      // Fallback to CJ API
      const cjRes = await getProductDetails(cjId);
      if (cjRes.success && cjRes.data) {
        product = cjRes.data;
        return NextResponse.json({
          success: true,
          data: {
            pid: product.pid,
            productName: product.productNameEn || product.productName,
            productNameEn: product.productNameEn || product.productName,
            productImage: product.productImage || product.bigImage || '',
            bigImage: product.bigImage || product.productImage || '',
            sellPrice: product.sellPrice || 0,
            description: product.description || '',
            variants: (product.variants || []).map((v: any) => ({
              vid: v.vid,
              variantNameEn: v.variantNameEn || v.variantKey || 'Default',
              variantSellPrice: v.variantSellPrice,
              variantSku: v.variantSku,
              variantWeight: v.variantWeight,
              inventory: v.inventory,
              variantImage: v.variantImage || '',
              variantKey: v.variantKey || 'default',
            })),
          }
        });
      }
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        pid: product.cjId,
        productName: product.name,
        productNameEn: product.name,
        productImage: product.images?.[0] || '',
        bigImage: product.images?.[0] || '',
        sellPrice: product.variants?.[0]?.baseCost || 0,
        variants: product.variants.map((v: any) => ({
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
