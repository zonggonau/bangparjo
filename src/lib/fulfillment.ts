import { prisma } from '@/lib/db';
import { createOrder } from '@/lib/cj-api';

/**
 * Common logic to process a local order and send it to CJ Dropshipping.
 * Used by both manual admin fulfillment and automated payment webhooks.
 */
export async function processFulfillment(orderNum: string) {
  // 1. Get the local order
  const order = await prisma.order.findUnique({
    where: { orderNum },
  });

  if (!order) {
    throw new Error('Order not found in database');
  }

  if (order.status === 'FULFILLED' || order.status === 'FULFILLING') {
    return { success: true, message: 'Already fulfilled or in progress' };
  }

  // 1.5 Set status ke FULFILLING untuk mengunci proses (Race condition protection)
  await prisma.order.update({
    where: { orderNum },
    data: { status: 'FULFILLING' }
  });

  if (!order.orderData) {
    // Kembalikan ke PAID jika data tidak ada agar bisa diulang
    await prisma.order.update({ where: { orderNum }, data: { status: 'PAID' } });
    throw new Error('Order data (CJ payload) is missing');
  }

  try {
    // 2. Gunakan stored CJ payload (sudah berupa objek karena tipe Json di Prisma)
    const cjPayload = order.orderData;

    if (!cjPayload || typeof cjPayload !== 'object') {
      throw new Error('Order data (CJ payload) is missing or invalid');
    }

    // 3. Get payType from settings (2: Auto Balance, 3: Manual Pay on CJ)
    const payTypeSetting = await prisma.storeSetting.findUnique({
      where: { key: 'cjPayType' }
    });
    
    let payType = 3; // Default to manual
    if (payTypeSetting?.value) {
      try {
        payType = JSON.parse(payTypeSetting.value);
      } catch {
        payType = parseInt(payTypeSetting.value) || 3;
      }
    }

    // 4. Call CJ API to create (and pay if payType 2)
    console.log(`[Fulfillment] Processing order ${orderNum} to CJ with payType ${payType}...`);
    const res = await createOrder({
      ...(cjPayload as any),
      payType: payType
    });

    if (res.success) {
      const cjOrderId = (res.data as any)?.cjOrderId || (res.data as any)?.orderId;
      
      // 4. Update local status
      const updatedOrder = await prisma.order.update({
        where: { orderNum },
        data: {
          cjOrderId,
          status: 'FULFILLED',
        },
      });

      return { success: true, order: updatedOrder, cjData: res.data };
    } else {
      // If CJ fails (e.g. balance too low), throw an error so the catch block handles it
      throw new Error(`CJ API Error: ${res.message || 'Unknown'}`);
    }
  } catch (error: any) {
    console.error(`[Fulfillment Error] Order ${orderNum}:`, error);
    // Revert status to PAID so admin can retry
    await prisma.order.update({
      where: { orderNum },
      data: { status: 'PAID' },
    });
    throw error;
  }
}
