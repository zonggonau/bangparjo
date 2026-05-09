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

  // 2. Gunakan stored CJ payload (sudah berupa objek karena tipe Json di Prisma)
  const cjPayload = order.orderData;

  if (!cjPayload || typeof cjPayload !== 'object') {
    throw new Error('Order data (CJ payload) is missing or invalid');
  }

  // 3. Call CJ API to create and pay (payType 2)
  console.log(`[Fulfillment] Auto-processing order ${orderNum} to CJ...`);
  const res = await createOrder(cjPayload);

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
    // If CJ fails (e.g. balance too low), at least mark as PAID in our DB 
    // so the admin knows the customer paid but the sync failed.
    await prisma.order.update({
      where: { orderNum },
      data: { status: 'PAID' },
    });
    
    throw new Error(`CJ API Error: ${res.message || 'Unknown'}`);
  }
}
