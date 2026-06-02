import { NextResponse } from 'next/server';
import { getOrderList } from '@/lib/cj';
import { auth } from '@/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageNum = parseInt(searchParams.get('pageNum') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const status = searchParams.get('status') || '';

  try {
    const res = await getOrderList({ pageNum, pageSize, status });
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('CJ Orders Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
