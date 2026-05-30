import { NextResponse } from 'next/server';
import { getTrackingInfo } from '@/lib/cj';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  try {
    const res = await getTrackingInfo(orderId);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error('CJ Order Detail Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
