import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * CJ Dropshipping Webhook Handler
 * Documentation: https://developers.cjdropshipping.com/
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('[CJ Webhook] Received:', JSON.stringify(payload, null, 2));

    const { type, messageType, params } = payload;

    // 1. Log the webhook event
    await prisma.webhookLog.create({
      data: {
        eventType: type || messageType || 'UNKNOWN',
        payload: payload,
      },
    });

    // 2. Handle ORDER status changes
    if (type === 'ORDER' && messageType === 'UPDATE') {
      const { orderId, status, trackingNumber } = params || {};

      if (orderId) {
        // CJ Order Status Mapping (Contoh)
        // 1: Pending, 2: Processing, 3: Shipped, 4: Delivered, 10: Cancelled
        let localStatus = 'PROCESSING';
        if (status === 3) localStatus = 'SHIPPED';
        if (status === 4) localStatus = 'DELIVERED';
        if (status === 10) localStatus = 'CANCELLED';

        await prisma.order.update({
          where: { cjOrderId: orderId },
          data: {
            status: localStatus,
            trackingNumber: trackingNumber || undefined,
            cjResponse: payload, // Simpan respons lengkap untuk audit
          },
        });
        
        console.log(`[CJ Webhook] Updated order ${orderId} to ${localStatus}`);
      }
    }

    // 3. Handle STOCK changes (Optional but professional)
    if (type === 'STOCK' && messageType === 'UPDATE') {
       const { variantId, inventory } = params || {};
       if (variantId) {
         await prisma.variant.update({
           where: { cjId: variantId },
           data: { inventory: parseInt(inventory) || 0 }
         });
         console.log(`[CJ Webhook] Updated stock for variant ${variantId} to ${inventory}`);
       }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CJ Webhook] Error:', error);
    // Kita tetap return 200 agar CJ tidak terus menerus me-retry jika error bukan dari koneksi
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
