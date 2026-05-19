import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { notifyOrderCreated } from '@/lib/openclaw';

const WEBHOOK_SECRET = process.env.OPENCLAW_WEBHOOK_SECRET || process.env.OPENCLAW_TOKEN || '';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';

/**
 * Trigger OpenClaw webhook when order is created
 * This allows OpenClaw (WhatsApp AI Agent) to automatically send messages to customers
 */
async function triggerOpenClawWebhook(order: any) {
  if (!WEBHOOK_SECRET) {
    console.warn('[Orders] OPENCLAW_WEBHOOK_SECRET not configured, skipping webhook trigger');
    return;
  }

  try {
    const checkoutUrl = `${BASE_URL}/checkout/${order.orderNum}?id=${order.checkoutToken}`;
    
    // Parse order data to get shipping country code
    let shippingCountryCode = '';
    try {
      const orderData = typeof order.orderData === 'string'
        ? JSON.parse(order.orderData)
        : order.orderData;
      shippingCountryCode = orderData?.shippingCountryCode || '';
    } catch (e) { /* ignore */ }

    const payload = {
      event: 'order.created',
      data: {
        orderNum: order.orderNum,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        shippingCountryCode,
        checkoutUrl,
        createdAt: order.createdAt?.toISOString() || new Date().toISOString(),
      }
    };

    // Fire-and-forget: trigger OpenClaw webhook
    fetch(`${BASE_URL}/api/webhooks/openclaw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WEBHOOK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'order-created',
        data: payload.data,
      }),
    }).then(res => {
      if (!res.ok) {
        console.warn('[Orders] OpenClaw webhook returned', res.status);
      }
    }).catch(err => {
      console.warn('[Orders] OpenClaw webhook error:', err.message);
    });

    console.log('[Orders] OpenClaw webhook triggered for order', order.orderNum);
  } catch (err: any) {
    console.warn('[Orders] Failed to trigger OpenClaw webhook:', err.message);
  }
}

export async function POST(req: Request) {
  try {
    const { orderNum, customerEmail, customerName, customerPhone, totalAmount, costAmount, status, orderData } = await req.json();
    if (!orderNum) {
      return NextResponse.json({ success: false, message: 'orderNum is required' }, { status: 400 });
    }

    const checkoutToken = crypto.randomBytes(32).toString('hex'); // 64 chars

    const order = await prisma.order.upsert({
      where: { orderNum },
      update: {
        customerEmail,
        customerName,
        customerPhone,
        totalAmount,
        costAmount,
        status: status || 'UNPAID',
        orderData: typeof orderData === 'string' ? JSON.parse(orderData) : orderData,
        checkoutToken,
      },
      create: {
        orderNum,
        checkoutToken,
        customerEmail,
        customerName,
        customerPhone,
        totalAmount,
        costAmount,
        status: status || 'UNPAID',
        orderData: typeof orderData === 'string' ? JSON.parse(orderData) : orderData,
      },
    });

    // Kirim notifikasi WA ke admin untuk order baru
    notifyOrderCreated({
      orderNum: order.orderNum,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      status: order.status,
    }).catch(err => console.warn('[OpenClaw] Notif order gagal:', err));

    // 🔥 Trigger OpenClaw webhook so WhatsApp Business can auto-send messages to customer
    triggerOpenClawWebhook(order);

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Save order error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
    }, { status: 500 });
  }
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const orderNum = searchParams.get('orderNum');
    const token = searchParams.get('token');

    if (orderNum) {
      const order = await prisma.order.findUnique({ 
        where: { orderNum },
        include: { items: { include: { variant: true } } }
      });
      
      if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      
      // If token is provided, validate it
      if (token && order.checkoutToken !== token) {
        return NextResponse.json({ success: false, error: 'Invalid security token' }, { status: 403 });
      }

      return NextResponse.json({ success: true, data: order });
    }

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      return NextResponse.json(order);
    }

    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
    }, { status: 500 });
  }
}
