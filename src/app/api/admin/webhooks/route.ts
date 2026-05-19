import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // Return webhook settings
    if (type === 'settings') {
      const urlSetting = await prisma.storeSetting.findUnique({ where: { key: 'webhook_url' } });
      const secretSetting = await prisma.storeSetting.findUnique({ where: { key: 'webhook_secret' } });
      const eventsSetting = await prisma.storeSetting.findUnique({ where: { key: 'webhook_events' } });

      return NextResponse.json({
        success: true,
        data: {
          url: urlSetting?.value || '',
          secret: secretSetting?.value || '',
          events: eventsSetting ? JSON.parse(eventsSetting.value) : [],
        },
      });
    }

    // Return webhook logs (default)
    const logs = await prisma.webhookLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, secret, events } = body;

    // Save webhook settings
    const settings = [
      { key: 'webhook_url', value: url || '' },
      { key: 'webhook_secret', value: secret || '' },
      { key: 'webhook_events', value: JSON.stringify(events || []) },
    ];

    for (const s of settings) {
      await prisma.storeSetting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
