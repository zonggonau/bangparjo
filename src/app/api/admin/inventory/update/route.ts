import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PATCH(req: Request) {
  try {
    const { id, isHero } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Bypass validation menggunakan raw query
    await prisma.$executeRaw`
      UPDATE "Product" SET "isHero" = ${!!isHero} WHERE id = ${id}
    `;

    // Ambil data terbaru (casting ke any untuk menghindari error tipe di client lama)
    const updated: any = await prisma.$queryRaw`
      SELECT * FROM "Product" WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true, 
      product: updated[0] 
    });
  } catch (error: any) {
    console.error('[Inventory Update Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
