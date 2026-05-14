import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/social/schedule
 * Schedule a product post for a specific future time
 *
 * GET /api/social/schedule
 * List all scheduled posts
 *
 * DELETE /api/social/schedule?id=xxx
 * Cancel a scheduled post
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pid, platforms, storeBaseUrl, scheduledAt } = body;

    if (!pid || !scheduledAt) {
      return NextResponse.json({ error: 'pid and scheduledAt are required' }, { status: 400 });
    }

    const scheduleTime = new Date(scheduledAt);
    if (scheduleTime <= new Date()) {
      return NextResponse.json({ error: 'scheduledAt must be in the future' }, { status: 400 });
    }

    const scheduleId = `sched_${pid}_${Date.now()}`;
    const scheduleData = {
      id: scheduleId,
      pid,
      platforms: platforms || ['facebook', 'instagram'],
      storeBaseUrl: storeBaseUrl || process.env.AUTH_URL || 'https://yourstore.com',
      scheduledAt: scheduleTime.toISOString(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    await prisma.storeSetting.create({
      data: {
        key: scheduleId,
        value: JSON.stringify(scheduleData),
      },
    });

    return NextResponse.json({ success: true, scheduleId, scheduledAt: scheduleTime.toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const records = await prisma.storeSetting.findMany({
      where: { key: { startsWith: 'sched_' } },
      orderBy: { key: 'asc' },
    });

    const schedules = records.map(r => {
      try { return JSON.parse(r.value); } catch { return null; }
    }).filter(Boolean);

    return NextResponse.json({ success: true, schedules });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    await prisma.storeSetting.delete({ where: { key: id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
