import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Ambil produk lokal yang di-mark sebagai hero, dibatasi 8 produk
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { variants: true },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    });

    // Map ke format CJProduct untuk kompatibilitas ProductCard
    const mapped = products.map(p => ({
      pid: p.cjId,
      productName: p.name,
      productNameEn: p.name,
      productImage: p.images?.[0] || '/placeholder.png',
      bigImage: p.images?.[0] || '/placeholder.png',
      productImageSet: p.images || [],
      sellPrice: p.variants?.[0]?.baseCost || 0,
      categoryName: '',
      categoryId: '',
      isFromLocalDB: true,
    }));

    return NextResponse.json({
      success: true,
      data: { list: mapped, total: mapped.length }
    });
  } catch (error: any) {
    console.error('[Featured Products API] Error:', error);
    return NextResponse.json({ success: false, message: error.message, data: { list: [], total: 0 } }, { status: 500 });
  }
}
