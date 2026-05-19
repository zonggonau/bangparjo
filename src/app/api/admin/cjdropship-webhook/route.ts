/**
 * Admin API: CJ Dropshipping Webhook Registration
 *
 * Manages CJ webhook registration from the admin dashboard.
 * Allows registering/unregistering the webhook URL with CJ Dropshipping API.
 *
 * Endpoints:
 *   GET    /api/admin/cjdropship-webhook?type=status  → Check current registration status
 *   POST   /api/admin/cjdropship-webhook              → Register webhook with CJ
 *   DELETE /api/admin/cjdropship-webhook              → Unregister all webhooks
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { setWebhook, type WebhookSetting } from '@/lib/cj-api';
import { notifyWebhookRegister } from '@/lib/openclaw-client';

// ── GET: Check registration status ───────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // Return webhook logs
    if (type === 'logs') {
      const logs = await prisma.webhookLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({ success: true, data: logs });
    }

    // Return CJ webhook registration status from StoreSettings
    if (type === 'status') {
      const registeredAt = await prisma.storeSetting.findUnique({
        where: { key: 'CJ_WEBHOOK_REGISTERED_AT' },
      });
      const callbackUrl = await prisma.storeSetting.findUnique({
        where: { key: 'CJ_WEBHOOK_URL' },
      });
      const events = await prisma.storeSetting.findUnique({
        where: { key: 'CJ_WEBHOOK_EVENTS' },
      });

      return NextResponse.json({
        success: true,
        data: {
          registered: !!registeredAt?.value,
          registeredAt: registeredAt?.value || null,
          callbackUrl: callbackUrl?.value || '',
          events: events ? JSON.parse(events.value) : [],
        },
      });
    }

    // Return the configured callback URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
    const callbackUrl = `${baseUrl}/api/cjdropship/webhook`;

    return NextResponse.json({
      success: true,
      data: {
        callbackUrl,
        allEvents: ['product', 'stock', 'order', 'logistics'],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── POST: Register Webhook with CJ Dropshipping ──────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { events, callbackUrl: customUrl } = body;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
    const callbackUrl = customUrl || `${baseUrl}/api/cjdropship/webhook`;

    // Build webhook settings for each event type
    const createSetting = (enabled: boolean): WebhookSetting => ({
      type: enabled ? 'ENABLE' : 'CANCEL',
      callbackUrls: enabled ? [callbackUrl] : [],
    });

    // Determine which events are enabled
    const enabledEvents = events || ['order', 'logistics', 'stock'];
    const hasProduct = enabledEvents.includes('product');
    const hasStock = enabledEvents.includes('stock');
    const hasOrder = enabledEvents.includes('order');
    const hasLogistics = enabledEvents.includes('logistics');

    // Register with CJ API
    const result = await setWebhook({
      product: createSetting(hasProduct),
      stock: createSetting(hasStock),
      order: createSetting(hasOrder),
      logistics: createSetting(hasLogistics),
    });

    if (result.success || result.result) {
      // Save to local settings
      await prisma.storeSetting.upsert({
        where: { key: 'CJ_WEBHOOK_URL' },
        update: { value: callbackUrl },
        create: { key: 'CJ_WEBHOOK_URL', value: callbackUrl },
      });
      await prisma.storeSetting.upsert({
        where: { key: 'CJ_WEBHOOK_EVENTS' },
        update: { value: JSON.stringify(enabledEvents) },
        create: { key: 'CJ_WEBHOOK_EVENTS', value: JSON.stringify(enabledEvents) },
      });
      await prisma.storeSetting.upsert({
        where: { key: 'CJ_WEBHOOK_REGISTERED_AT' },
        update: { value: new Date().toISOString() },
        create: { key: 'CJ_WEBHOOK_REGISTERED_AT', value: new Date().toISOString() },
      });

      // Notify admin via WhatsApp
      await notifyWebhookRegister({
        success: true,
        message: `Webhook registered successfully!\nURL: ${callbackUrl}\nEvents: ${enabledEvents.join(', ')}`,
      });

      return NextResponse.json({
        success: true,
        data: {
          callbackUrl,
          events: enabledEvents,
          cjResult: result,
        },
      });
    } else {
      // Notify admin of failure
      await notifyWebhookRegister({
        success: false,
        message: `Webhook registration failed: ${result.message}`,
      });

      return NextResponse.json({
        success: false,
        error: result.message || 'CJ API returned failure',
        cjResult: result,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[CJ Webhook Register Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── DELETE: Unregister all webhooks ──────────────────────────────────────────

export async function DELETE() {
  try {
    // Cancel all webhooks
    const cancelSetting: WebhookSetting = {
      type: 'CANCEL',
      callbackUrls: [],
    };

    const result = await setWebhook({
      product: cancelSetting,
      stock: cancelSetting,
      order: cancelSetting,
      logistics: cancelSetting,
    });

    // Clear local settings
    await prisma.storeSetting.deleteMany({
      where: {
        key: { in: ['CJ_WEBHOOK_URL', 'CJ_WEBHOOK_EVENTS', 'CJ_WEBHOOK_REGISTERED_AT'] },
      },
    }).catch(() => {});

    await notifyWebhookRegister({
      success: true,
      message: 'All CJ webhooks have been unregistered.',
    });

    return NextResponse.json({
      success: true,
      message: 'All webhooks cancelled',
      cjResult: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
