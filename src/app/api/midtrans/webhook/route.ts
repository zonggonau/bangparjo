import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processFulfillment } from '@/lib/fulfillment';
import { sendPaymentSuccessEmail } from '@/lib/mail';
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

      // Atomic update to prevent race conditions from concurrent webhooks
      const updateResult = await prisma.order.updateMany({
        where: { 
          orderNum: actualOrderId,
          status: { in: ['UNPAID', 'PENDING'] }
        },
        data: { status: 'PAID' }
      });

      if (updateResult.count === 0) {
        console.log(`[Midtrans Webhook] Order ${actualOrderId} is already processed or not in UNPAID state (caught by race condition guard). Skipping.`);
        return NextResponse.json({ status: 'ok' });
      }

      // Re-fetch order to get its full details for emails/fulfillment if needed
      const existingOrder = await prisma.order.findUnique({ where: { orderNum: actualOrderId } });
      if (!existingOrder) {
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }

      // Background Processing (Fire-and-forget) to prevent Midtrans timeout
      (async () => {
        try {
          // Send payment success email
          await sendPaymentSuccessEmail(actualOrderId);

          // Auto-fulfill to CJ Dropshipping
          const result = await processFulfillment(actualOrderId);
          console.log(`[Midtrans Webhook] Fulfillment result for ${actualOrderId}:`, result.success ? 'SUCCESS' : 'FAILED');
        } catch (error: any) {
          console.error(`[Midtrans Webhook] Background task error for ${actualOrderId}:`, error.message);
        }
      })();

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

    // Return 200 OK immediately so Midtrans doesn't timeout
    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('[Midtrans Webhook] Error:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
