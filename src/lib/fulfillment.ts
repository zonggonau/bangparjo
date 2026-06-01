import { prisma } from '@/lib/db';
import { createOrder, getBalance, payBalance } from '@/lib/cj';

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

<<<<<<< HEAD
  // 4. Call CJ API to create the order
  console.log(`[Fulfillment] Processing order ${orderNum} to CJ with payType ${payType}...`);
  const res = await createOrder({
    ...(cjPayload as any),
    payType: payType
  });

  if (!res.success) {
    // If CJ fails, mark as PAID so admin knows customer paid but sync failed
=======
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
>>>>>>> main
    await prisma.order.update({
      where: { orderNum },
      data: { status: 'PAID' },
    });
<<<<<<< HEAD
    throw new Error(`CJ API Error: ${res.message || 'Unknown'}`);
=======
    throw error;
>>>>>>> main
  }

  const cjOrderId = (res.data as any)?.cjOrderId || (res.data as any)?.orderId;
  const lineItemIds: Record<string, string> = {};

  // Extract lineItemId per product from CJ response (if available)
  const cjProducts: any[] = (res.data as any)?.products || [];
  for (const p of cjProducts) {
    if (p.storeLineItemId && p.lineItemId) {
      lineItemIds[p.storeLineItemId] = p.lineItemId;
    }
  }

  // 5. Auto-pay with CJ balance if payType = 2 (auto balance)
  if (payType === 2 && cjOrderId) {
    try {
      console.log(`[Fulfillment] Auto-paying order ${orderNum} (CJ: ${cjOrderId}) via balance...`);
      const payRes = await payBalance({ orderNumber: cjOrderId });
      if (payRes.success) {
        console.log(`[Fulfillment] Auto-pay SUCCESS for ${orderNum}`);
      } else {
        console.warn(`[Fulfillment] Auto-pay FAILED for ${orderNum}: ${payRes.message}`);
        // Notify admin of pay failure via OpenClaw (non-blocking)
        import('@/lib/openclaw-client').then(({ sendCustomWA }) => {
          const adminWa = process.env.NEXT_PUBLIC_WHATSAPP || '628219105980';
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
          sendCustomWA(adminWa, [
            `⚠️ *CJ Auto-Pay Failed*`,
            ``,
            `Order: #${orderNum}`,
            `CJ Order: ${cjOrderId}`,
            `Error: ${payRes.message}`,
            ``,
            `Please pay manually in CJ dashboard.`,
            `🔗 ${baseUrl}/admin/orders`,
          ].join('\n')).catch(() => {});
        });
      }
    } catch (payErr: any) {
      console.error(`[Fulfillment] Auto-pay error for ${orderNum}:`, payErr.message);
    }
  }

  // 6. Update local order with CJ order ID and FULFILLED status
  const updatedOrder = await prisma.order.update({
    where: { orderNum },
    data: {
      cjOrderId,
      status: 'FULFILLED',
      cjResponse: res.data as any,
    },
  });

  // 7. Update lineItemIds in OrderItem records (if available from CJ)
  if (Object.keys(lineItemIds).length > 0) {
    for (const [storeItemId, lineItemId] of Object.entries(lineItemIds)) {
      await prisma.orderItem.updateMany({
        where: { id: storeItemId },
        data: { cjLineItemId: lineItemId } as any,
      }).catch(() => {}); // Ignore if field doesn't exist yet
    }
  }

  // 8. Notify admin via OpenClaw (non-blocking)
  import('@/lib/openclaw-client').then(({ sendCustomWA }) => {
    const adminWa = process.env.NEXT_PUBLIC_WHATSAPP || '628219105980';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
    sendCustomWA(adminWa, [
      `✅ *Order Fulfilled to CJ*`,
      ``,
      `Store Order: #${orderNum}`,
      `CJ Order ID: ${cjOrderId || '-'}`,
      `Pay Type: ${payType === 2 ? 'Auto Balance' : 'Manual'}`,
      ``,
      `🔗 ${baseUrl}/admin/orders`,
    ].join('\n')).catch(() => {});
  });

  return { success: true, order: updatedOrder, cjData: res.data };
}
