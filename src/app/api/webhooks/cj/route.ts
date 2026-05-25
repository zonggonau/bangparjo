/**
 * CJ Dropshipping Webhook — Legacy Compatibility
 *
 * Routes incoming CJ webhooks to the new enhanced handler.
 * This ensures backward compatibility for any existing CJ dashboard configurations
 * that point to /api/webhooks/cj instead of /api/cjdropship/webhook.
 *
 * New setups should register: /api/cjdropship/webhook
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidateTag } from 'next/cache';
import { sendCustomWA } from '@/lib/openclaw-client';
import { notifyCJOrderUpdate, notifyTrackingUpdate } from '@/lib/openclaw-client';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('[CJ Webhook (Legacy)] Received:', JSON.stringify(payload, null, 2));

    const { type, messageType, params } = payload;

    // Log the webhook event
    await prisma.webhookLog.create({
      data: {
        eventType: type || messageType || 'UNKNOWN',
        payload: payload,
      },
    });

    // Handle ORDER status changes
    if (type === 'ORDER' && messageType === 'UPDATE') {
      const { orderId, orderNumber, status, trackingNumber } = params || {};
      const orderRef = orderNumber || orderId;

      if (orderRef) {
        let localStatus = 'PROCESSING';
        if (status === 3) localStatus = 'SHIPPED';
        if (status === 4) localStatus = 'DELIVERED';
        if (status === 10) localStatus = 'CANCELLED';

        // Try updating by orderNum first, then by cjOrderId
        const updatedOrder = await prisma.order.update({
          where: { orderNum: orderRef },
          data: {
            status: localStatus,
            trackingNumber: trackingNumber || undefined,
            cjResponse: payload,
          },
        }).catch(() =>
          prisma.order.update({
            where: { cjOrderId: orderRef },
            data: {
              status: localStatus,
              trackingNumber: trackingNumber || undefined,
              cjResponse: payload,
            },
          }).catch(() => null)
        );

        if (updatedOrder) {
          console.log(`[CJ Webhook] Updated order ${orderRef} → ${localStatus}`);

          // Notify admin via OpenClaw
          await notifyCJOrderUpdate({
            orderNumber: orderRef,
            cjOrderId: orderId,
            orderStatus: localStatus,
          });

          // Notify customer
          if (updatedOrder.customerPhone && localStatus === 'SHIPPED') {
            const phone = updatedOrder.customerPhone.replace(/^\+/, '');
            const waMsg = [
              `📦 *Your Order Has Shipped!*`,
              ``,
              `Hi *${updatedOrder.customerName || 'there'}*! 🚀`,
              ``,
              `Your order *#${updatedOrder.orderNum}* is on its way!`,
              `Tracking: ${trackingNumber || 'N/A'}`,
              ``,
              `Track here: https://www.17track.net`,
              ``,
              `— BangParjo Shop`,
            ].join('\n');

            await sendCustomWA(phone, waMsg).catch(e =>
              console.warn('[CJ Webhook] Customer WA failed:', e.message)
            );
          }
        }
      }
    }

    // Handle STOCK changes
    if (type === 'STOCK' && messageType === 'UPDATE') {
      const { variantId, inventory } = params || {};
      if (variantId) {
        await prisma.variant.update({
          where: { cjId: variantId },
          data: { inventory: parseInt(inventory) || 0 },
        });
        console.log(`[CJ Webhook] Updated stock for ${variantId} → ${inventory}`);
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
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CJ Webhook] Error:', error);
    // Always return 200 to prevent CJ retries
    return NextResponse.json({ success: false, error: error.message });
  }
}
