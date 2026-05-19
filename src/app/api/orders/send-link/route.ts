import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendCheckoutEmail } from '@/lib/mail';
import { sendCustomWA } from '@/lib/openclaw';
import { normalizePhone } from '@/lib/phone';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { orderNum, token, checkoutUrl } = await req.json();

    if (!orderNum || !token) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // ── Rate limit: max 5 resend requests per order ─────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '127.0.0.1';
    const rateCheck = checkRateLimit(`send-link:${orderNum}:${ip}`, { interval: 60, maxRequests: 3 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: `Too many resend attempts. Please try again later.` },
        { status: 429 }
      );
    }

    // Use Raw Query as fallback since emailSent might be new
    let order: any = null;
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "Order" WHERE "orderNum" = $1 LIMIT 1`,
        orderNum
      );
      order = rows.length > 0 ? rows[0] : null;
    } catch (e) {
      order = await prisma.order.findUnique({ where: { orderNum } });
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Verify token
    if (order.checkoutToken !== token) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 403 });
    }

    // If already sent, don't send again unless forced
    if (order.emailSent) {
      return NextResponse.json({ success: true, message: 'Email already sent previously' });
    }

    // Parse orderData to get shipping country code
    let shippingCountryCode = '';
    try {
      const orderData = typeof order.orderData === 'string'
        ? JSON.parse(order.orderData)
        : order.orderData;
      shippingCountryCode = orderData?.shippingCountryCode || '';
    } catch (e) {
      // ignore parse errors
    }

    // ── 1. Send Email ───────────────────────────────────────────────────────
    let emailSent = false;
    if (order.customerEmail) {
      const mailRes = await sendCheckoutEmail(order.customerEmail, orderNum, checkoutUrl);
      emailSent = mailRes.success;
    }

    // ── 2. Send WhatsApp to Customer (global phone support) ─────────────────
    let waSent = false;
    const customerPhone = order.customerPhone || '';
    if (customerPhone) {
      // Normalize phone using country code from shipping address
      const cleanPhone = normalizePhone(customerPhone, shippingCountryCode);

      if (cleanPhone.length >= 10) {
        const waMessage = [
          `🛒 *BangParjo Shop — Payment Confirmation*`,
          ``,
          `Hi *${order.customerName || 'there'}*! 👋`,
          ``,
          `Thank you for ordering at BangParjo Shop.`,
          `Your order *#${orderNum}* has been received.`,
          `Please *complete your payment* to proceed!`,
          ``,
          `🔗 *Payment Link:*`,
          `${checkoutUrl}`,
          ``,
          `⏳ *Deadline: 24 hours*`,
          `Once paid, we'll process your order right away.`,
          ``,
          `If you have any questions, just reply to this message 😊`,
          ``,
          `— BangParjo Shop`,
        ].join('\n');

        const waRes = await sendCustomWA(cleanPhone, waMessage);
        waSent = waRes.success;
        if (!waSent) {
          console.warn('[SendLink] WA failed to send to', cleanPhone, waRes.error);
        }
      } else {
        console.warn('[SendLink] Invalid phone number:', customerPhone, 'cleaned:', cleanPhone);
      }
    }

    // ── 3. Send Admin Notification ──────────────────────────────────────────
    const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP || '628219105980';
    const adminMsg = [
      `🛒 *NEW ORDER — Link Sent*`,
      ``,
      `Order: #${orderNum}`,
      `Name: ${order.customerName || '-'}`,
      `Email: ${order.customerEmail || '-'}`,
      `Phone: ${customerPhone || '-'}`,
      `Country: ${shippingCountryCode || '-'}`,
      `Email sent: ${emailSent ? '✅' : '❌'}`,
      `WA sent: ${waSent ? '✅' : '❌'}`,
      ``,
      `🔗 ${checkoutUrl}`,
    ].join('\n');
    sendCustomWA(adminPhone, adminMsg).catch(() => {});

    // ── 4. Mark as sent ─────────────────────────────────────────────────────
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Order" SET "emailSent" = true, "waSent" = $1 WHERE "orderNum" = $2`,
        waSent,
        orderNum
      );
    } catch (dbErr) {
      console.error('Failed to update sent flags:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      emailSent,
      waSent,
    });

  } catch (error: any) {
    console.error('[Send Link Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
