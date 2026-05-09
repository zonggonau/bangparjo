import { NextResponse } from 'next/server';
import { processFulfillment } from '@/lib/fulfillment';

export async function POST(req: Request) {
  try {
    const { orderNum } = await req.json();

    if (!orderNum) {
      return NextResponse.json({ success: false, message: 'orderNum is required' }, { status: 400 });
    }

    const result = await processFulfillment(orderNum);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Manual Fulfill error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message,
    }, { status: 500 });
  }
}
