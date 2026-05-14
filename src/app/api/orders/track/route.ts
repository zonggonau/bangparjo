import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/orders/track?id=ORDER_ID
 * Public endpoint — looks up order by orderNum or email
 * Returns safe tracking info (no internal cost data)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id')?.trim();

  if (!id) {
    return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
  }

  try {
    // Find by orderNum
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNum: id },
          { cjOrderId: id },
        ],
      },
      select: {
        orderNum: true,
        status: true,
        trackingNumber: true,
        createdAt: true,
        totalAmount: true,
        customerName: true,
        cjResponse: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' });
    }

    // Extract logistic name from cjResponse if available
    let logisticName: string | null = null;
    try {
      if (order.cjResponse) {
        const parsed = order.cjResponse as any;
        logisticName = parsed.logisticName || parsed.carrier || null;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      order: {
        orderNum: order.orderNum,
        status: order.status,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt?.toISOString(),
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        logisticName,
      },
    });
  } catch (err: any) {
    console.error('[Track API Error]:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
