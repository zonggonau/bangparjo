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
    // 1. Idempotency Check (prevent duplicate processing)
    if (messageId) {
      const recentLogs = await prisma.webhookLog.findMany({
        where: { eventType: type || messageType || 'UNKNOWN' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      const isDuplicate = recentLogs.some((log) => (log.payload as any)?.messageId === messageId);
      
      if (isDuplicate) {
        console.log(`[CJ Webhook] Skipping duplicate messageId: ${messageId}`);
        return NextResponse.json({ success: true, messageId, note: 'duplicate skipped' });
      }
    }

    // 2. Log webhook
    await prisma.webhookLog.create({
      data: {
        eventType: type || messageType || 'UNKNOWN',
        payload: body,
        processed: true,
      },
    });

    console.log(`🔔 [CJ Dropship Webhook]: ${type}/${messageType}`, params);

    // 3. Dispatch by type
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
      case 'PRODUCT':
<<<<<<< HEAD
        await handleProductUpdate(params);
=======
      case 'VARIANT':
        await handleProductUpdate(type, messageType, params);
>>>>>>> fe928faf3c7a520b3e9879a7f24b8c173ff098c6
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

// ── PRODUCT & VARIANT Update ────────────────────────────────────────────────

async function handleProductUpdate(type: string, messageType: string, params: any) {
  const pid = params.pid;
  const vid = params.vid;

  if (messageType === 'DELETE') {
    if (type === 'PRODUCT' && pid) {
      await prisma.product.updateMany({
        where: { cjId: pid },
        data: { status: 'INACTIVE' },
      });
      console.log(`[CJ Webhook] Product ${pid} set to INACTIVE (DELETED)`);
    } else if (type === 'VARIANT' && vid) {
      await prisma.variant.updateMany({
        where: { cjId: vid },
        data: { inventory: 0 },
      });
      console.log(`[CJ Webhook] Variant ${vid} stock set to 0 (DELETED)`);
    }
    return;
  }

  // Handle INSERT or UPDATE
  if (type === 'PRODUCT' && pid) {
    const product = await prisma.product.findUnique({ where: { cjId: pid } });
    if (!product) {
      console.log(`[CJ Webhook] PRODUCT ${messageType}: Product ${pid} not found in local DB. Skipping.`);
      return;
    }

    const updateData: any = {};
    if (params.productNameEn) updateData.name = params.productNameEn;
    if (params.productDescription) updateData.description = params.productDescription;
    if (params.productStatus) updateData.status = params.productStatus === 3 ? 'ACTIVE' : 'INACTIVE';
    if (params.productImage) updateData.images = { set: [params.productImage] };

    if (Object.keys(updateData).length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: updateData,
      });
      console.log(`[CJ Webhook] Updated product ${pid}`);
    }
  } 
  else if (type === 'VARIANT' && vid) {
    // If variant exists, update it. If not, try to fetch its parent and create it.
    const variant = await prisma.variant.findUnique({ 
      where: { cjId: vid },
      include: { product: true }
    });

    const baseCost = Number(params.variantSellPrice || 0);
    const weight = Number(params.variantWeight || 0);
    const inventory = Number(params.variantStatus === 3 ? (params.inventory || 100) : 0);

    if (variant) {
      await prisma.variant.update({
        where: { id: variant.id },
        data: {
          sku: params.variantSku || variant.sku,
          baseCost: baseCost || variant.baseCost,
          sellingPrice: baseCost || variant.sellingPrice,
          weight: weight || variant.weight,
          inventory: inventory,
          image: params.variantImage || variant.image,
          color: params.variantKey || variant.color,
        }
      });
      console.log(`[CJ Webhook] Updated variant ${vid}`);
    } else {
      // NEW VARIANT or UPGRADE (Product exists but variant doesn't)
      // We need to know which product this belongs to.
      // Call CJ API to get the parent PID.
      const { getVariantById } = await import('@/lib/cj-api');
      const vRes = await getVariantById(vid);
      
      if (vRes.success && vRes.data && vRes.data.pid) {
        const parentCjId = vRes.data.pid;
        const product = await prisma.product.findUnique({ where: { cjId: parentCjId } });
        
        if (product) {
          const vData = vRes.data;
          await prisma.variant.create({
            data: {
              productId: product.id,
              cjId: vid,
              sku: vData.variantSku,
              color: vData.variantKey || 'Default',
              size: vData.variantNameEn || '',
              weight: Number(vData.variantWeight || 0),
              baseCost: Number(vData.variantSellPrice || 0),
              sellingPrice: Number(vData.variantSellPrice || 0),
              inventory: 100, // Default for new variant
              image: vData.variantImage || product.images[0],
            }
          });
          
          // Update parent product metadata
          const updatedProduct = await prisma.product.findUnique({
            where: { id: product.id },
            include: { variants: true }
          });
          
          if (updatedProduct) {
            await prisma.product.update({
              where: { id: product.id },
              data: {
                variantCount: updatedProduct.variants.length,
                totalStock: updatedProduct.variants.reduce((sum, v) => sum + v.inventory, 0),
              }
            });
          }
          
          console.log(`[CJ Webhook] Created new variant ${vid} for product ${parentCjId}`);
        } else {
          console.log(`[CJ Webhook] Variant ${vid} belongs to unknown product ${parentCjId}. Skipping.`);
        }
      }
    }
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
    (orderStatus === 'CANCELLED' || orderStatus === 'CLOSED') ? 'CANCELLED' :
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

  if (internalStatus === 'CANCELLED') {
    const adminPhone = process.env.ADMIN_PHONE_NUMBER;
    if (adminPhone) {
      const cancelMsg = [
        `🚨 *ACTION REQUIRED: ORDER CANCELLED*`,
        ``,
        `CJ has cancelled order *#${orderNumber}*.`,
        `Please check CJ Dashboard for the reason.`,
        `If the customer has paid via Midtrans/PayPal, please process their *Refund* manually!`,
        ``,
        `— CJ Integration Bot`,
      ].join('\n');
      await sendCustomWA(adminPhone, cancelMsg).catch(() => {});
    }
  }

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

// ── PRODUCT Update ───────────────────────────────────────────────────────────

async function handleProductUpdate(params: any) {
  /**
   * CJ sends PRODUCT webhooks when:
   * - Product price changes
   * - Product availability changes (listed/unlisted)
   * - Product info updates
   *
   * params can contain: pid, vid, status, sellPrice, etc.
   */
  const { pid, vid, status, sellPrice } = params || {};

  console.log(`[CJ Webhook] PRODUCT update:`, params);

  // If variant-level update (has vid + new price)
  if (vid && sellPrice != null) {
    try {
      await prisma.variant.updateMany({
        where: { cjId: vid },
        data: { baseCost: parseFloat(sellPrice) },
      });
      console.log(`[CJ Webhook] Updated variant ${vid} baseCost → ${sellPrice}`);
    } catch (e: any) {
      console.warn(`[CJ Webhook] Variant update failed for ${vid}:`, e.message);
    }
  }

  // If product-level status update (listed/unlisted)
  if (pid && status !== undefined) {
    const productStatus = status === 0 ? 'INACTIVE' : 'ACTIVE';
    try {
      await prisma.product.updateMany({
        where: { cjId: pid },
        data: { status: productStatus },
      });
      console.log(`[CJ Webhook] Updated product ${pid} status → ${productStatus}`);
    } catch (e: any) {
      console.warn(`[CJ Webhook] Product status update failed for ${pid}:`, e.message);
    }
  }

  // Invalidate product caches
  revalidateTag('home:featured', { expire: 0 });
  revalidateTag('home:bestsellers', { expire: 0 });
  revalidateTag('home:categories', { expire: 0 });
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
    supportedTypes: ['ORDER', 'LOGISTIC', 'STOCK', 'PRODUCT'],
  });
}
