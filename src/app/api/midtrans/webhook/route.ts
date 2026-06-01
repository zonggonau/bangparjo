import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processFulfillment } from '@/lib/fulfillment';
import crypto from 'crypto';

/**
 * Midtrans Webhook Handler (Singular URL Support)
 * Documentation: https://docs.midtrans.com/en/after-payment/http-notification
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[Midtrans Webhook] Received notification:', body.order_id, body.transaction_status);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type
    } = body;

    // 1. Verify Signature for security
    // Payload: order_id + status_code + gross_amount + server_key
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hash = crypto.createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (hash !== signature_key) {
      console.error('[Midtrans Webhook] Invalid signature detected!');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
    }

    // 2. Extract actual orderNum
    // Midtrans Snap formats order_id as: "ORD-{timestamp}-{midtransTimestamp}"
    // We stored orderNum as "ORD-{timestamp}", so we strip only the LAST segment
    const parts = (order_id as string).split('-');
    const actualOrderId = parts.slice(0, -1).join('-') || order_id;

    // 3. Handle Payment Success
    // 'settlement' = paid for most methods (QRIS, VA, Cards)
    // 'capture' + 'accept' = paid for CC
    const isSuccess = 
      transaction_status === 'settlement' || 
      (transaction_status === 'capture' && body.fraud_status === 'accept');

    const isPending = transaction_status === 'pending';
    const isFailed = transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel';

    if (isSuccess) {
      console.log(`[Midtrans Webhook] Order ${actualOrderId} (from Snap ${order_id}) marked as PAID. Triggering fulfillment...`);

      // Guard: verify order exists before updating
      const existingOrder = await prisma.order.findUnique({ where: { orderNum: actualOrderId } });
      if (!existingOrder) {
        console.error(`[Midtrans Webhook] Order '${actualOrderId}' NOT FOUND in DB (raw order_id: '${order_id}')`);
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }

      // Update status to PAID first (customer has definitely paid)
      await prisma.order.update({
        where: { orderNum: actualOrderId },
        data: { status: 'PAID' }
      });

      try {
        // Auto-fulfill to CJ Dropshipping
        const result = await processFulfillment(actualOrderId);
        console.log(`[Midtrans Webhook] Fulfillment result for ${actualOrderId}:`, result.success ? 'SUCCESS' : 'FAILED');
      } catch (fulfillError: any) {
        console.error(`[Midtrans Webhook] Auto-fulfillment error for ${actualOrderId}:`, fulfillError.message);
        // Status remains 'PAID' from the update above, admin can retry manually
      }
    } else if (isFailed) {
      console.log(`[Midtrans Webhook] Order ${actualOrderId} FAILED/CANCELLED: ${transaction_status}`);
      const existingOrder = await prisma.order.findUnique({ where: { orderNum: actualOrderId } });
      if (existingOrder) {
        await prisma.order.update({
          where: { orderNum: actualOrderId },
          data: { status: 'CANCELLED' }
        });
      }
    } else if (isPending) {
      console.log(`[Midtrans Webhook] Order ${actualOrderId} is PENDING...`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[Midtrans Webhook] Error:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
