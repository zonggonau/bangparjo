'use server';

import { prisma } from '@/lib/db';
import { revalidateTag } from 'next/cache';

export async function getAdminWebhooksAction(type?: string) {
  try {
    if (type === 'settings') {
      const urlSetting = await prisma.storeSetting.findUnique({ where: { key: 'webhook_url' } });
      const secretSetting = await prisma.storeSetting.findUnique({ where: { key: 'webhook_secret' } });
      const eventsSetting = await prisma.storeSetting.findUnique({ where: { key: 'webhook_events' } });

      return {
        success: true,
        data: {
          url: urlSetting?.value || '',
          secret: secretSetting?.value || '',
          events: eventsSetting ? JSON.parse(eventsSetting.value) : [],
        },
      };
    }

    const logs = await prisma.webhookLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { success: true, data: logs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveAdminWebhookSettingsAction(url: string, secret: string, events: string[]) {
  try {
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

    revalidateTag('', { expire: 0 });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testAdminWebhookAction(type: string = 'ORDER', orderNum?: string, cjOrderId?: string, variantId?: string, stock?: number) {
  if (process.env.NODE_ENV === 'production') {
    return { success: false, error: 'Not allowed in production' };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/cj-webhook`;

    let payload: any = {
      messageId: `TEST-${Date.now()}`,
      type: type,
      messageType: 'UPDATE',
      params: {}
    };

    if (type === 'ORDER') {
      payload.params = {
        orderNumber: orderNum || 'ORD-TEST-123',
        cjOrderId: cjOrderId || 'CJ-TEST-456',
        orderStatus: 'SHIPPED'
      };
    } else if (type === 'LOGISTIC') {
      payload.params = {
        orderId: cjOrderId || 'CJ-TEST-456',
        trackingNumber: 'TRACK-TEST-789',
        logisticName: 'CJPacket Ordinary'
      };
    } else if (type === 'STOCK') {
      payload.params = {
        [variantId || 'VID-123']: [
          {
            vid: variantId || 'VID-123',
            areaEn: 'Test Warehouse',
            storageNum: stock || 99
          }
        ]
      };
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    return { success: true, mockPayload: payload, webhookResponse: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
