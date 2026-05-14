import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Get all level-3 categories (categories that have no children)
    const allCats = await prisma.category.findMany({
      where: {
        // Level 3 = has a parent that has a parent
        parent: {
          parent: { isNot: null }
        }
      },
      select: {
        cjId: true,
        name: true,
        parent: {
          select: {
            name: true,
            parent: { select: { name: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: allCats.map(c => ({
        cjId: c.cjId,
        name: c.name,
        categoryL1: c.parent?.parent?.name || '',
        categoryL2: c.parent?.name || '',
      })),
      total: allCats.length,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
