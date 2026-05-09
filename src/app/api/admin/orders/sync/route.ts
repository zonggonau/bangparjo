import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cjFetch } from '@/lib/cj-api';

/**
 * Manual Status Sync for a specific order
 * GET /api/admin/orders/sync?orderNum=ORD-XXX
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNum = searchParams.get('orderNum');

  if (!orderNum) {
    return NextResponse.json({ error: 'orderNum is required' }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { orderNum },
      select: { cjOrderId: true, status: true }
    });

    if (!order || !order.cjOrderId) {
      return NextResponse.json({ error: 'Order has no CJ ID' }, { status: 400 });
    }

    // Fetch latest from CJ
    // Endpoint: GET /v1/shopping/order/getOrderDetail?orderId=XXX
    const res = await cjFetch<any>(`/v1/shopping/order/getOrderDetail?orderId=${order.cjOrderId}`);

    if (res.success && res.data) {
      const cjStatus = res.data.orderStatus;
      
      // Update local status if different
      if (cjStatus !== order.status) {
        await prisma.order.update({
          where: { orderNum },
          data: { status: cjStatus }
        });
      }

      return NextResponse.json({ success: true, status: cjStatus });
    }

    return NextResponse.json({ error: res.message || 'Failed to fetch from CJ' }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
