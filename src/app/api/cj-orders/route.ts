import { NextResponse } from 'next/server';
import { getOrderList } from '@/lib/cj-api';

export async function GET(req: Request) {
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
