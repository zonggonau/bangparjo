import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processFulfillment } from '@/lib/fulfillment';

export async function POST(req: Request) {
  try {
    const { orderId, paypalData } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 });
    }

    // In a real production app, you should verify the payment with PayPal API here
    // using the paypalData.orderID.
    console.log(`[PayPal] Payment captured for ${orderId}. Updating status to PAID...`);

    // 1. Update status ke PAID dulu
    await prisma.order.update({
      where: { orderNum: orderId },
      data: { status: 'PAID' }
    });

    // 2. Auto-fulfill to CJ Dropshipping
    const result = await processFulfillment(orderId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
