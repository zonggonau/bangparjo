import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/categories';

export async function GET() {
  try {
    const allCats = await getAllCategories();

    return NextResponse.json({
      success: true,
      data: allCats,
      total: allCats.length,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
