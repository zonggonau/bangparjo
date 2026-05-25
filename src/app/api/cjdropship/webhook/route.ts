/**
 * CJ Dropshipping Webhook Handler — Enhanced with OpenClaw Notifications
 *
 * Receives webhook callbacks from CJ Dropshipping and:
 * 1. Updates local database (order status, stock, tracking)
 * 2. Sends WhatsApp notifications via OpenClaw to admin & customers
 * 3. Logs all webhook events for monitoring
 *
 * Endpoint: POST /api/cjdropship/webhook
 * Register this URL in CJ Dashboard → Webhook Settings
 *
 * CJ sends these event types:
 *   - ORDER:    Order status changes (SHIPPED, CANCELLED, etc.)
 *   - LOGISTIC: Tracking number updates
 *   - STOCK:    Inventory level changes
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidateTag } from 'next/cache';
import { sendCustomWA } from '@/lib/openclaw-client';
import {
  notifyCJOrderUpdate,
  notifyTrackingUpdate,
} from '@/lib/openclaw-client';

export async function POST(req: Request) {
  const body = await req.json();
  const { type, params, messageId, messageType } = body;

  try {
    // 1. Log webhook
    await prisma.webhookLog.create({
      data: {
        eventType: type || messageType || 'UNKNOWN',
        payload: body,
      },
    });

    console.log(`🔔 [CJ Dropship Webhook]: ${type}/${messageType}`, params);

    // 2. Dispatch by type
    switch (type) {
      case 'ORDER':
        await handleOrderUpdate(params);
        break;
      case 'LOGISTIC':
        await handleLogisticUpdate(params);
        break;
      case 'STOCK':
        await handleStockUpdate(params);
        break;
      default:
        console.warn(`[CJ Webhook] Unhandled type: ${type}`);
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error('❌ [CJ Dropship Webhook Error]:', error);
    try {
      await prisma.webhookLog.create({
        data: {
          eventType: type || messageType || 'UNKNOWN',
          payload: body,
          error: error.message,
          processed: false,
        },
      });
    } catch {}
    // Always return 200 to prevent CJ from retrying
    return NextResponse.json({ success: false, error: error.message });
  }
}

// ── ORDER Status Update ──────────────────────────────────────────────────────

async function handleOrderUpdate(params: any) {
  const { orderNumber, cjOrderId, orderStatus } = params;
  if (!orderNumber) {
    console.warn('[CJ Webhook] ORDER update missing orderNumber');
    return;
  }

  // Map CJ status to local status
  const internalStatus =
    orderStatus === 'SHIPPED' ? 'SHIPPED' :
    orderStatus === 'CANCELLED' ? 'CANCELLED' :
    orderStatus === 'COMPLETED' ? 'DELIVERED' :
    'PROCESSING';

  // Update local order
  const updatedOrder = await prisma.order.update({
    where: { orderNum: orderNumber },
    data: {
      cjOrderId: cjOrderId || undefined,
      status: internalStatus,
      cjResponse: params,
    },
  });

  console.log(`[CJ Webhook] Updated order ${orderNumber} → ${internalStatus}`);

  // ── Send WhatsApp Notification via OpenClaw ──

  // 1. Notify admin
  await notifyCJOrderUpdate({
    orderNumber,
    cjOrderId,
    orderStatus,
  });

  // 2. Notify customer via OpenClaw if they have a phone number
  if (updatedOrder.customerPhone) {
    const customerPhone = updatedOrder.customerPhone.startsWith('+')
      ? updatedOrder.customerPhone.substring(1)
      : updatedOrder.customerPhone;

    const statusEmoji: Record<string, string> = {
      SHIPPED: '📦',
      CANCELLED: '❌',
      DELIVERED: '✅',
      PROCESSING: '🔧',
    };

    const statusMsg: Record<string, string> = {
      SHIPPED: `Your order *#${orderNumber}* has been shipped! 🚀\nTrack your package using the tracking number.`,
      CANCELLED: `Your order *#${orderNumber}* has been cancelled. Contact us if you have any questions.`,
      DELIVERED: `Your order *#${orderNumber}* has been delivered! 🎉\nThank you for shopping with us! 😊`,
      PROCESSING: `Your order *#${orderNumber}* is now being processed. Stay tuned for updates!`,
    };

    const emoji = statusEmoji[internalStatus] || '📢';
    const message = statusMsg[internalStatus] || `Status update for order #${orderNumber}: ${internalStatus}`;

    const waMessage = [
      `${emoji} *Order Update #${orderNumber}*`,
      ``,
      message,
      ``,
      `— BangParjo Shop`,
    ].join('\n');

    await sendCustomWA(customerPhone, waMessage)
      .catch(e => console.warn('[CJ Webhook] Customer WA failed:', e.message));
  }
}

// ── LOGISTIC / Tracking Update ───────────────────────────────────────────────

async function handleLogisticUpdate(params: any) {
  const { orderId, trackingNumber, logisticName } = params;
  if (!orderId) return;

  // Try to find order by cjOrderId first, then by orderNum
  const updatedOrder = await prisma.order.update({
    where: { cjOrderId: orderId },
    data: {
      trackingNumber: trackingNumber || undefined,
      status: 'SHIPPED',
      cjResponse: params,
    },
  }).catch(async () => {
    // Fallback: try to find by orderNum if cjOrderId isn't set yet
    // Some CJ webhooks send the order number in `orderId`
    return prisma.order.update({
      where: { orderNum: orderId },
      data: {
        trackingNumber: trackingNumber || undefined,
        status: 'SHIPPED',
        cjResponse: params,
      },
    });
  });

  console.log(`[CJ Webhook] Tracking updated for ${orderId}: ${trackingNumber}`);

  // 1. Notify admin
  await notifyTrackingUpdate({
    orderId,
    trackingNumber,
    logisticName,
  });

  // 2. Notify customer
  if (updatedOrder?.customerPhone && trackingNumber) {
    const customerPhone = updatedOrder.customerPhone.startsWith('+')
      ? updatedOrder.customerPhone.substring(1)
      : updatedOrder.customerPhone;

    const waMessage = [
      `📦 *Your Order Has Shipped!*`,
      ``,
      `Hi *${updatedOrder.customerName || 'there'}*! 🚀`,
      ``,
      `Good news — your order *#${updatedOrder.orderNum}* is on its way!`,
      ``,
      `📬 *Courier:* ${logisticName || 'CJ Dropshipping'}`,
      `🔢 *Tracking:* ${trackingNumber}`,
      ``,
      `Track here: https://www.17track.net`,
      ``,
      `— BangParjo Shop`,
    ].join('\n');

    await sendCustomWA(customerPhone, waMessage)
      .catch(e => console.warn('[CJ Webhook] Customer tracking WA failed:', e.message));
  }
}

// ── STOCK / Inventory Update ─────────────────────────────────────────────────

async function handleStockUpdate(params: any) {
  const lowStockVariants: { sku: string; name: string; stock: number }[] = [];

  for (const vid in params) {
    const warehouseInfo = params[vid];
    if (Array.isArray(warehouseInfo) && warehouseInfo.length > 0) {
      const totalStock = warehouseInfo.reduce(
        (sum: number, w: any) => sum + (w.storageNum || 0),
        0
      );

      await prisma.variant.updateMany({
        where: { cjId: vid },
        data: { inventory: totalStock },
      });

      // Track low stock items (threshold: < 10 units)
      if (totalStock < 10 && totalStock > 0) {
        const variant = await prisma.variant.findFirst({
          where: { cjId: vid },
          include: { product: { select: { name: true } } },
        });
        if (variant) {
          lowStockVariants.push({
            sku: variant.sku,
            name: variant.product?.name || variant.sku,
            stock: totalStock,
          });
        }
      }
    }
  }

  // Invalidate home page cache so updated products appear
  revalidateTag('home:featured', { expire: 0 });
  revalidateTag('home:bestsellers', { expire: 0 });
  revalidateTag('home:beauty', { expire: 0 });
  revalidateTag('home:fashion', { expire: 0 });
  revalidateTag('home:electronics', { expire: 0 });
  revalidateTag('home:toys', { expire: 0 });
  revalidateTag('home:homeliving', { expire: 0 });
  revalidateTag('home:categories', { expire: 0 });

  // Alert admin if there are low stock items
  if (lowStockVariants.length > 0) {
    const { notifyLowStock } = await import('@/lib/openclaw-client');
    await notifyLowStock(lowStockVariants);
  }
}

/**
 * GET /api/cjdropship/webhook
 * Health check / info endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'CJ Dropshipping Webhook Handler',
    version: '2.0.0',
    supportedTypes: ['ORDER', 'LOGISTIC', 'STOCK'],
  });
}
