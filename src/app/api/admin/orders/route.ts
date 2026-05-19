import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTrackingInfo } from '@/lib/cj-api';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('[Admin Orders GET Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// Sync specific order with CJ
export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order?.cjOrderId) {
      return NextResponse.json({ success: false, error: 'Order not linked to CJ' }, { status: 400 });
    }

    const cjRes = await getTrackingInfo(order.cjOrderId);
    if (cjRes.success) {
      const cjData = cjRes.data as any;
      
      // Update local order status based on CJ status
      // CJ Statuses: 1: Pending, 2: Paid, 3: Processing, 4: Shipped, 5: Completed, 6: Cancelled
      const statusMap: Record<string, string> = {
        '1': 'PENDING',
        '2': 'PAID',
        '3': 'PROCESSING',
        '4': 'SHIPPED',
        '5': 'DELIVERED',
        '6': 'CANCELLED'
      };

      const newStatus = statusMap[String(cjData.status)] || order.status;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          trackingNumber: cjData.trackingNumber || order.trackingNumber,
          cjResponse: cjData
        }
      });

      return NextResponse.json({ success: true, status: newStatus });
    }

    return NextResponse.json({ success: false, error: cjRes.message || 'CJ Sync Failed' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin Orders Sync Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
