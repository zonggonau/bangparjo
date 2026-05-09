import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Ambil level 1 dan level 2 saja untuk menu
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      take: 12, // Batasi untuk menu utama
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
