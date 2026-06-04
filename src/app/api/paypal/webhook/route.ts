import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processFulfillment } from '@/lib/fulfillment';
import { sendPaymentSuccessEmail } from '@/lib/mail';

/**
 * PayPal Webhook Handler
 * Endpoint: /api/paypal/webhook
 * 
 * Untuk keamanan maksimal di produksi, Anda harus memverifikasi signature header 
 * menggunakan SDK PayPal. Namun, secara fungsional, endpoint ini akan memproses 
 * notifikasi pembayaran berhasil.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventType = body.event_type;
    
    console.log(`[PayPal Webhook] Received event: ${eventType}`);

    // Kita fokus pada event pembayaran berhasil
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
      const resource = body.resource;
      
      // Ambil Order ID lokal kita yang disimpan di custom_id atau reference_id
      const orderNum = resource.custom_id || resource.purchase_units?.[0]?.reference_id || resource.reference_id;

      if (!orderNum) {
        console.warn('[PayPal Webhook] No local order ID found in webhook payload');
        return NextResponse.json({ message: 'No order ID' }, { status: 400 });
      }

      console.log(`[PayPal Webhook] Processing order: ${orderNum}`);

      // 1. Update status di database kita
      const order = await prisma.order.findUnique({
        where: { orderNum }
      });

      if (!order) {
        console.error(`[PayPal Webhook] Order ${orderNum} not found in database`);
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
      }

      if (order.status === 'UNPAID') {
        await prisma.order.update({
          where: { orderNum },
          data: { status: 'PAID' }
        });

        // Send payment success email
        await sendPaymentSuccessEmail(orderNum);

        // 2. Jalankan Fulfillment otomatis ke CJ Dropshipping
        try {
          const result = await processFulfillment(orderNum);
          console.log(`[PayPal Webhook] Fulfillment result for ${orderNum}:`, result.success ? 'SUCCESS' : 'FAILED');
        } catch (fulfillError: any) {
          console.error(`[PayPal Webhook] Auto-fulfillment error for ${orderNum}:`, fulfillError.message);
        }
      } else {
        console.log(`[PayPal Webhook] Order ${orderNum} already processed (Status: ${order.status})`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[PayPal Webhook] Error:', error.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
