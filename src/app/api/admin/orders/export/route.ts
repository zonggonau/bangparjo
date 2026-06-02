import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrderList } from '@/lib/cj-api';
import { auth } from '@/auth';

/**
 * Admin Orders Export API
 *
 * GET /api/admin/orders/export
 * Query params: source (LOCAL|CJ), status (ALL|UNPAID|PAID|...), search
 *
 * Returns a CSV file with BOM for Excel compatibility.
 * For LOCAL source: fetches all orders from Prisma with items/variant/product includes.
 * For CJ source: fetches from CJ Dropshipping API via getOrderList().
 */

export const dynamic = 'force-dynamic';

function escapeCSV(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  // Escape double quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '$0.00';
  return `$${Number(amount).toFixed(2)}`;
}

function formatItems(items: any[]): string {
  if (!items || items.length === 0) return '';
  return items
    .map((item: any) => {
      const productName = item.variant?.product?.name || 'Unknown Product';
      const qty = item.quantity || 0;
      const price = formatCurrency(item.price);
      return `${productName} x${qty} (${price})`;
    })
    .join(' | ');
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const source = (searchParams.get('source') || 'LOCAL').toUpperCase();
    const statusFilter = (searchParams.get('status') || 'ALL').toUpperCase();
    const searchQuery = (searchParams.get('search') || '').toLowerCase();

    let csvRows: string[][] = [];

    const headers = [
      'order_number',
      'customer_name',
      'customer_email',
      'total_amount',
      'status',
      'tracking_number',
      'date',
      'items',
    ];

    if (source === 'CJ') {
      // ── Fetch all orders from CJ (no pagination limit — export is bulk) ──
      const cjRes = await getOrderList({ pageNum: 1, pageSize: 500 });

      if (!cjRes.success || !cjRes.data) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch CJ orders: ' + (cjRes.message || 'Unknown error') },
          { status: 502 }
        );
      }

      const data = cjRes.data as any;
      let cjOrders: any[] = data.list || [];

      // Apply status filter
      if (statusFilter !== 'ALL') {
        cjOrders = cjOrders.filter((o: any) => {
          const s = (o.status || o.orderStatus || '').toUpperCase();
          return s === statusFilter;
        });
      }

      // Apply search filter
      if (searchQuery) {
        cjOrders = cjOrders.filter((o: any) => {
          const orderId = (o.orderId || '').toLowerCase();
          const customerName = (o.shippingCustomerName || '').toLowerCase();
          const customerEmail = (o.shippingEmail || o.email || '').toLowerCase();
          return (
            orderId.includes(searchQuery) ||
            customerName.includes(searchQuery) ||
            customerEmail.includes(searchQuery)
          );
        });
      }

      csvRows = cjOrders.map((o: any) => [
        o.orderId || o.orderNumber || '',
        o.shippingCustomerName || '',
        o.shippingEmail || o.email || '',
        formatCurrency(o.orderAmount || o.totalAmount || 0),
        o.status || o.orderStatus || 'UNKNOWN',
        o.trackingNumber || '',
        o.createDate || o.createdTime || o.createdAt || '',
        '', // CJ orders don't have local item details
      ]);
    } else {
      // ── Fetch all orders from Prisma with includes ──
      const whereClause: any = {};

      if (statusFilter !== 'ALL') {
        whereClause.status = statusFilter;
      }

      if (searchQuery) {
        whereClause.OR = [
          { orderNum: { contains: searchQuery, mode: 'insensitive' } },
          { customerName: { contains: searchQuery, mode: 'insensitive' } },
          { customerEmail: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }

      const localOrders = await prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      csvRows = localOrders.map((o) => [
        o.orderNum || '',
        o.customerName || '',
        o.customerEmail || '',
        formatCurrency(o.totalAmount),
        o.status || 'UNKNOWN',
        o.trackingNumber || '',
        o.createdAt.toISOString(),
        formatItems(o.items),
      ]);
    }

    // ── Build CSV content ──
    const bom = '\uFEFF';
    const csvContent =
      bom +
      [headers, ...csvRows]
        .map((row) => row.map((cell) => escapeCSV(cell)).join(','))
        .join('\n');

    // ── Return CSV as downloadable attachment ──
    const filename = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[Orders Export API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
