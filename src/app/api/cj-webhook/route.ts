import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendWhatsAppOrderNotification } from '@/lib/social-poster';
import { revalidateTag } from 'next/cache';

/**
 * CJ Dropshipping Webhook Receiver (Enhanced)
 * Handles:
 * - ORDER: Status changes → WhatsApp notification to customer
 * - LOGISTIC: Tracking number → WhatsApp tracking notification
 * - STOCK: Inventory sync
 *
 * Register this URL in CJ dashboard:
 *   https://yourstore.com/api/cj-webhook
 */

/**
 * GET handler — Required for CJ webhook URL validation.
 * CJ's webhook/set API performs a URL reachability check before accepting
 * the callback URL. This handler returns 200 OK to pass validation.
 */
export async function GET() {
  return NextResponse.json({ success: true, message: 'Webhook endpoint is active' });
}

export async function POST(req: Request) {
  let body: any = {};
  let type = '';
  let messageType = '';
  let params: any = {};
  let messageId = '';

  try {
    body = await req.json();
    type = body?.type || '';
    messageType = body?.messageType || '';
    params = body?.params || {};
    messageId = body?.messageId || '';
  } catch {
    // CJ sends a validation POST to verify the callback URL.
    // Return 200 OK immediately to pass URL validation.
    return NextResponse.json({ success: true, message: 'Webhook endpoint is active' });
  }

  // ── Respond 200 OK immediately (CJ requires response within 3 seconds) ──
  // Process webhook logic asynchronously after sending response.
  const response = NextResponse.json({ success: true, messageId });

  // Fire-and-forget: process webhook in background
  processWebhook(type, messageType, params, body, messageId).catch((err) => {
    console.error('❌ [CJ WEBHOOK BACKGROUND ERROR]:', err);
  });

  return response;
}

/**
 * Process webhook event asynchronously.
 * This runs after the 200 OK response is sent to CJ,
 * so any database delays or errors won't affect URL validation.
 */
async function processWebhook(
  type: string,
  messageType: string,
  params: any,
  body: any,
  messageId: string
) {
  try {
    // 1. Log webhook (fire-and-forget, don't block on failure)
    try {
      await prisma.webhookLog.create({
        data: { eventType: type, payload: body },
      });
    } catch (logErr) {
      console.warn('[CJ WEBHOOK] Logging failed (table may not exist yet):', logErr);
    }

    console.log(`🔔 [CJ WEBHOOK]: ${type}`, params);

    // 2. Dispatch
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
      case 'VARIANT':
        await handleProductUpdate(type, messageType, params);
        break;
      default:
        console.warn(`[CJ WEBHOOK]: Unhandled type: ${type}`);
    }
  } catch (error: any) {
    console.error('❌ [CJ WEBHOOK PROCESSING ERROR]:', error);
    try {
      await prisma.webhookLog.create({
        data: { eventType: type, payload: body, error: error.message, processed: false },
      });
    } catch {}
  }
}

async function handleOrderUpdate(params: any) {
  const { orderNumber, cjOrderId, orderStatus } = params;
  if (!orderNumber) return;

  const internalStatus =
    orderStatus === 'SHIPPED' ? 'SHIPPED' :
    orderStatus === 'CANCELLED' ? 'CANCELLED' :
    orderStatus === 'COMPLETED' ? 'DELIVERED' : 'PROCESSING';

  const updatedOrder = await prisma.order.update({
    where: { orderNum: orderNumber },
    data: { cjOrderId, status: internalStatus, cjResponse: params },
  });

  // WhatsApp notification for key status changes
  if ((internalStatus === 'SHIPPED' || internalStatus === 'PROCESSING') && updatedOrder.customerPhone) {
    const phone = updatedOrder.customerPhone.startsWith('+') 
      ? updatedOrder.customerPhone 
      : `+${updatedOrder.customerPhone}`;
    
    await sendWhatsAppOrderNotification({
      to: phone,
      customerName: updatedOrder.customerName || 'Customer',
      orderId: orderNumber,
      totalAmount: Number(updatedOrder.totalAmount) || 0,
      type: internalStatus === 'SHIPPED' ? 'order_shipped' : 'order_placed',
    }).catch(e => console.warn('[WA Notify Error]:', e.message));
  }
}

async function handleLogisticUpdate(params: any) {
  const { orderId, trackingNumber, logisticName } = params;
  if (!orderId) return;

  const updatedOrder = await prisma.order.update({
    where: { cjOrderId: orderId },
    data: { trackingNumber, status: 'SHIPPED', cjResponse: params },
  });

  // Send tracking WhatsApp if customer has phone
  if (updatedOrder.customerPhone && trackingNumber) {
    const phone = updatedOrder.customerPhone.startsWith('+')
      ? updatedOrder.customerPhone
      : `+${updatedOrder.customerPhone}`;

    await sendWhatsAppOrderNotification({
      to: phone,
      customerName: updatedOrder.customerName || 'Customer',
      orderId: updatedOrder.orderNum,
      totalAmount: Number(updatedOrder.totalAmount) || 0,
      trackingNumber,
      type: 'order_shipped',
    }).catch(e => console.warn('[WA Tracking Error]:', e.message));
  }
}

async function handleStockUpdate(params: any) {
  for (const vid in params) {
    const warehouseInfo = params[vid];
    if (Array.isArray(warehouseInfo) && warehouseInfo.length > 0) {
      const totalStock = warehouseInfo.reduce((sum: number, w: any) => sum + (w.storageNum || 0), 0);
      await prisma.variant.updateMany({
        where: { cjId: vid },
        data: { inventory: totalStock },
      });
    }
  }
}

async function handleProductUpdate(type: string, messageType: string | undefined, params: any) {
  const { pid, vid, status, sellPrice } = params || {};
  
  console.log(`[CJ Webhook] PRODUCT/VARIANT update type=${type} messageType=${messageType}:`, params);

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

  // Handle INSERT, UPDATE, or other updates
  if (pid && (type === 'PRODUCT' || !vid)) {
    const updateData: any = {};
    if (params.productNameEn) updateData.name = params.productNameEn;
    if (params.productDescription) updateData.description = params.productDescription;
    if (params.productStatus !== undefined) {
      updateData.status = params.productStatus === 3 ? 'ACTIVE' : 'INACTIVE';
    } else if (status !== undefined) {
      updateData.status = status === 0 ? 'INACTIVE' : 'ACTIVE';
    }
    if (params.productImage) updateData.images = { set: [params.productImage] };

    if (Object.keys(updateData).length > 0) {
      await prisma.product.updateMany({
        where: { cjId: pid },
        data: updateData,
      });
      console.log(`[CJ Webhook] Updated product ${pid} with data:`, updateData);
    }
  }

  if (vid && (type === 'VARIANT' || vid)) {
    const variant = await prisma.variant.findUnique({
      where: { cjId: vid },
      include: { product: true }
    });

    const baseCost = sellPrice !== undefined ? parseFloat(sellPrice) : Number(params.variantSellPrice || 0);
    const weight = Number(params.variantWeight || 0);
    
    // Determine inventory if status/inventory is provided
    let inventory: number | undefined = undefined;
    if (params.variantStatus !== undefined) {
      inventory = params.variantStatus === 3 ? Number(params.inventory || 100) : 0;
    } else if (params.inventory !== undefined) {
      inventory = Number(params.inventory);
    }

    if (variant) {
      const vUpdateData: any = {};
      if (params.variantSku) vUpdateData.sku = params.variantSku;
      if (baseCost > 0) {
        vUpdateData.baseCost = baseCost;
        vUpdateData.sellingPrice = baseCost;
      }
      if (weight > 0) vUpdateData.weight = weight;
      if (inventory !== undefined) vUpdateData.inventory = inventory;
      if (params.variantImage) vUpdateData.image = params.variantImage;
      if (params.variantKey) vUpdateData.color = params.variantKey;

      if (Object.keys(vUpdateData).length > 0) {
        await prisma.variant.update({
          where: { id: variant.id },
          data: vUpdateData
        });
        console.log(`[CJ Webhook] Updated variant ${vid} with data:`, vUpdateData);
      }
    } else {
      // NEW VARIANT or UPGRADE (Product exists but variant doesn't)
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

  // Invalidate product caches
  try {
    revalidateTag('home:featured', { expire: 0 });
    revalidateTag('home:bestsellers', { expire: 0 });
    revalidateTag('home:categories', { expire: 0 });
  } catch (e) {}
}
