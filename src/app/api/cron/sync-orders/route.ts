import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTrackingInfo } from '@/lib/cj';

// ── Order Sync Cron Job ──────────────────────────────────────────────────
// Trigger: Every 15 minutes (configured via Vercel Cron / external cron)
// Endpoint: GET /api/cron/sync-orders?key={CRON_SECRET}
// Syncs local order statuses with CJ Dropshipping tracking data.

export const maxDuration = 120; // 2 minutes max execution

const STATUS_MAP: Record<string, string> = {
  '1': 'PENDING',
  '2': 'PAID',
  '3': 'PROCESSING',
  '4': 'SHIPPED',
  '5': 'DELIVERED',
  '6': 'CANCELLED',
};

export async function GET(req: Request) {
  // ── Authenticate cron request ────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    details: [] as string[],
  };

  try {
    // ── Fetch uncancelled orders with CJ IDs ────────────────────────────
    const orders = await prisma.order.findMany({
      where: {
        cjOrderId: { not: null },
        status: { notIn: ['DELIVERED', 'CANCELLED', 'COMPLETED'] },
      },
      take: 50, // Process 50 per run to avoid timeout
      orderBy: { updatedAt: 'asc' },
    });

    results.processed = orders.length;

    for (const order of orders) {
      try {
        if (!order.cjOrderId) {
          results.skipped++;
          continue;
        }

        const cjRes = await getTrackingInfo(order.cjOrderId);
        if (!cjRes.success || !cjRes.data) {
          results.skipped++;
          continue;
        }

        const cjData = cjRes.data as any;
        const cjStatus = String(cjData.status || '');
        const newStatus = STATUS_MAP[cjStatus];

        if (newStatus && newStatus !== order.status) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: newStatus,
              trackingNumber: cjData.trackingNumber || order.trackingNumber,
              cjResponse: cjData,
            },
          });
          results.updated++;
          results.details.push(`#${order.orderNum}: ${order.status} → ${newStatus}`);
        } else {
          results.skipped++;
        }
      } catch (orderErr: any) {
        results.failed++;
        results.details.push(`#${order.orderNum}: Error - ${orderErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Sync Orders] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      durationMs: Date.now() - startTime,
    }, { status: 500 });
  }
}
