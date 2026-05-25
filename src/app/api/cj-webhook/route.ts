import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendWhatsAppOrderNotification } from '@/lib/social-poster';

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
export async function POST(req: Request) {
  const body = await req.json();
  const { type, messageType, params, messageId } = body;

  try {
    // 1. Log webhook
    await prisma.webhookLog.create({
      data: { eventType: type, payload: body },
    });

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

    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error('❌ [CJ WEBHOOK ERROR]:', error);
    try {
      await prisma.webhookLog.create({
        data: { eventType: type, payload: body, error: error.message, processed: false },
      });
    } catch {}
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

async function handleProductUpdate(type: string, messageType: string, params: any) {
  const pid = params.pid;
  const vid = params.vid;

  if (messageType === 'DELETE') {
    if (type === 'PRODUCT' && pid) {
      // Soft delete or unpublish product
      await prisma.product.updateMany({
        where: { cjId: pid },
        data: { status: 'INACTIVE' },
      });
    } else if (type === 'VARIANT' && vid) {
      await prisma.variant.updateMany({
        where: { cjId: vid },
        data: { inventory: 0 }, // Just set to 0 or we could delete
      });
    }
  } else {
    // UPDATE or INSERT -> Since we don't sync all fields manually, the safest way 
    // to ensure consistency is to set a flag or trigger a background sync.
    // However, to keep it simple, we can just log it or update specific fields if provided.
    if (type === 'PRODUCT' && pid && params.productStatus) {
      const isOffSale = params.productStatus === 2;
      await prisma.product.updateMany({
        where: { cjId: pid },
        data: { status: isOffSale ? 'INACTIVE' : 'ACTIVE' },
      });
    } else if (type === 'VARIANT' && vid && params.variantStatus) {
      // similar handling could be done for variant status
    }
  }
}
