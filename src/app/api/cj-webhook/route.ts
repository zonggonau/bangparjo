import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * CJ Dropshipping Webhook Receiver
 * Handles:
 * - ORDER: Status changes (CREATED -> SHIPPED -> etc)
 * - LOGISTIC: Tracking number updates
 * - STOCK: Inventory changes
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { type, params, messageId } = body;

  try {
    // 1. Log the webhook request for auditing
    await prisma.webhookLog.create({
      data: {
        eventType: type,
        payload: body,
      },
    });

    console.log(`🔔 [CJ WEBHOOK]: Received ${type} message`, params);

    // 2. Handle specific message types
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
        console.warn(`[CJ WEBHOOK]: Unhandled event type: ${type}`);
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error: any) {
    console.error('❌ [CJ WEBHOOK ERROR]:', error);
    
    // Log the error in the WebhookLog table if possible
    try {
      await prisma.webhookLog.create({
        data: {
          eventType: type,
          payload: body,
          error: error.message,
          processed: false
        }
      });
    } catch (e) {
      console.error('Could not log webhook error to DB', e);
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Handle Order Status Changes
 */
async function handleOrderUpdate(params: any) {
  const { orderNumber, cjOrderId, orderStatus } = params;
  if (!orderNumber) return;

  // Map CJ status to our internal status
  // CJ Statuses: CREATED, PROCESSING, SHIPPED, COMPLETED, CANCELLED
  let internalStatus = 'PROCESSING';
  if (orderStatus === 'SHIPPED') internalStatus = 'SHIPPED';
  if (orderStatus === 'CANCELLED') internalStatus = 'CANCELLED';

  await prisma.order.update({
    where: { orderNum: orderNumber },
    data: {
      cjOrderId: cjOrderId,
      status: internalStatus,
      cjResponse: params // Store latest payload
    }
  });
}

/**
 * Handle Logistics/Tracking Updates
 */
async function handleLogisticUpdate(params: any) {
  const { orderId, trackingNumber, logisticName } = params;
  if (!orderId) return;

  await prisma.order.update({
    where: { cjOrderId: orderId },
    data: {
      trackingNumber,
      status: 'SHIPPED',
      cjResponse: params
    }
  });
}

/**
 * Handle Inventory/Stock Updates
 */
async function handleStockUpdate(params: any) {
  // Params is a map of VID -> WarehouseInfo[]
  for (const vid in params) {
    const warehouseInfo = params[vid];
    if (Array.isArray(warehouseInfo) && warehouseInfo.length > 0) {
      // Sum up stock across all warehouses or pick the main one
      const totalStock = warehouseInfo.reduce((sum: number, w: any) => sum + (w.storageNum || 0), 0);
      
      await prisma.variant.updateMany({
        where: { cjId: vid },
        data: { inventory: totalStock }
      });
    }
  }
}
