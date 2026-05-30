import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/orders
 * Admin endpoint to list orders with optional status filter.
 * Used by admin tracking page and other admin components.
 *
 * Query params:
 *   ?status=SHIPPED       — Filter by status
 *   ?page=1               — Page number
 *   ?limit=50             — Items per page (max 100)
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (status) {
      // Support comma-separated statuses: ?status=SHIPPED,DELIVERED
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          orderNum: true,
          cjOrderId: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          totalAmount: true,
          costAmount: true,
          shippingFee: true,
          status: true,
          trackingNumber: true,
          paymentStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Orders API] Error:', error.message);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
