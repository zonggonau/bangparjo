import { NextResponse } from 'next/server';
import { syncCategoryProducts } from '@/lib/cj-api';
import { auth } from '@/auth';

export async function POST(req: Request) {
  // 1. Proteksi Admin
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { categoryId, limit } = await req.json();

    if (!categoryId) {
      return NextResponse.json({ success: false, message: 'Missing Category ID' }, { status: 400 });
    }

    const result = await syncCategoryProducts(categoryId, limit || 100);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
