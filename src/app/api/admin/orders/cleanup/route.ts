import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find and delete UNPAID orders older than 24 hours
    const deleted = await prisma.order.deleteMany({
      where: {
        status: 'UNPAID',
        createdAt: {
          lt: twentyFourHoursAgo
        }
      }
    });

    console.log(`[Cleanup] Deleted ${deleted.count} expired unpaid orders.`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleted.count 
    });

  } catch (error: any) {
    console.error('[Cleanup Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
