/**
 * OpenClaw Webhook Endpoint — Enhanced with CJ Dropshipping Integration
 *
 * Public endpoint accessible by OpenClaw (running on VPS) to:
 * 1. Send WhatsApp messages to customers worldwide
 * 2. Retrieve order data & product info
 * 3. Trigger notifications to customers
 * 4. Manage CJ orders (create CJ order, check status, etc.)
 * 5. Admin management (list products, check stock, etc.)
 *
 * Endpoint: POST /api/webhooks/openclaw
 * Auth: Bearer token (OPENCLAW_TOKEN from .env)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendCustomWA } from '@/lib/openclaw-client';
import { normalizePhone } from '@/lib/phone';
import { notifyOrderCreated } from '@/lib/openclaw';

const WEBHOOK_SECRET = process.env.OPENCLAW_WEBHOOK_SECRET || process.env.OPENCLAW_TOKEN || '';

export async function POST(req: Request) {
  try {
    // ── Verify Auth ─────────────────────────────────────────────────────────
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token || token !== WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await req.json();
    const { action, data } = payload;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      // ── Send custom WhatsApp message ────────────────────────────────────
      case 'send-wa': {
        const { target, message } = data || {};
        if (!target || !message) {
          return NextResponse.json(
            { success: false, error: 'target and message are required' },
            { status: 400 }
          );
        }
        result = await sendCustomWA(target, message);
        break;
      }

      // ── Send broadcast to all customers ─────────────────────────────────
      case 'broadcast': {
        const { message, status } = data || {};
        if (!message) {
          return NextResponse.json(
            { success: false, error: 'message is required' },
            { status: 400 }
          );
        }

        // Get customers who have phone numbers
        // Optionally filter by order status
        const where: any = {
          customerPhone: { not: '' },
        };
        if (status) where.status = status;

        const orders = await prisma.order.findMany({
          where,
          select: { customerPhone: true, customerName: true },
          distinct: ['customerPhone'],
        });

        const phones = [...new Set(orders.map(o => o.customerPhone as string))];
        const results = await Promise.allSettled(
          phones.map(phone => sendCustomWA(phone, message))
        );

        const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        result = { success: true, data: { total: phones.length, sent, failed: phones.length - sent } };
        break;
      }

      // ── Send payment link to customer via WhatsApp ──────────────────────
      case 'send-payment-link': {
        const { orderNum } = data || {};
        if (!orderNum) {
          return NextResponse.json(
            { success: false, error: 'orderNum is required' },
            { status: 400 }
          );
        }

        const order = await prisma.order.findUnique({ where: { orderNum } });
        if (!order) {
          return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
          );
        }

        const customerPhone = order.customerPhone || '';
        if (!customerPhone) {
          return NextResponse.json(
            { success: false, error: 'Customer phone not available' },
            { status: 400 }
          );
        }

        // Get country code from order data
        let shippingCountryCode = '';
        try {
          const orderData = typeof order.orderData === 'string'
            ? JSON.parse(order.orderData)
            : order.orderData;
          shippingCountryCode = orderData?.shippingCountryCode || '';
        } catch (e) { /* ignore */ }

        const cleanPhone = normalizePhone(customerPhone, shippingCountryCode);

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
        const checkoutUrl = `${baseUrl}/checkout/${orderNum}?id=${order.checkoutToken}`;

        const waMessage = [
          `🛒 *BangParjo Shop — Payment Link*`,
          ``,
          `Hi *${order.customerName || 'there'}*!`,
          ``,
          `Here's your payment link for order *#${orderNum}*:`,
          `${checkoutUrl}`,
          ``,
          `⏳ *Deadline: 24 hours*`,
          `If you have any questions, just reply to this message 😊`,
        ].join('\n');

        result = await sendCustomWA(cleanPhone, waMessage);
        break;
      }

      // ── Send order status notification to customer ──────────────────────
      case 'notify-status': {
        const { orderNum, status, message: customMessage } = data || {};
        if (!orderNum || !status) {
          return NextResponse.json(
            { success: false, error: 'orderNum and status are required' },
            { status: 400 }
          );
        }

        const order = await prisma.order.findUnique({ where: { orderNum } });
        if (!order) {
          return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
          );
        }

        const customerPhone = order.customerPhone || '';
        if (!customerPhone) {
          return NextResponse.json(
            { success: false, error: 'Customer phone not available' },
            { status: 400 }
          );
        }

        let shippingCountryCode = '';
        try {
          const orderData = typeof order.orderData === 'string'
            ? JSON.parse(order.orderData)
            : order.orderData;
          shippingCountryCode = orderData?.shippingCountryCode || '';
        } catch (e) { /* ignore */ }

        const cleanPhone = normalizePhone(customerPhone, shippingCountryCode);

        const statusEmoji: Record<string, string> = {
          PAID: '✅',
          PROCESSING: '🔧',
          SHIPPED: '📦',
          DELIVERED: '🎉',
          CANCELLED: '❌',
        };

        const statusLabels: Record<string, string> = {
          PAID: 'Payment Received',
          PROCESSING: 'Processing',
          SHIPPED: 'Shipped',
          DELIVERED: 'Delivered',
          CANCELLED: 'Cancelled',
        };

        const msg = customMessage || [
          `${statusEmoji[status] || '📢'} *Order Update #${orderNum}*`,
          ``,
          `Status: *${statusLabels[status] || status}*`,
          ``,
          `Thank you for shopping at BangParjo Shop 😊`,
        ].join('\n');

        result = await sendCustomWA(cleanPhone, msg);
        break;
      }

      // ── Get order data ──────────────────────────────────────────────────
      case 'get-order': {
        const { orderNum } = data || {};
        if (!orderNum) {
          return NextResponse.json(
            { success: false, error: 'orderNum is required' },
            { status: 400 }
          );
        }

        const order = await prisma.order.findUnique({
          where: { orderNum },
          include: {
            items: {
              include: {
                variant: {
                  select: { sku: true, cjId: true, baseCost: true, sellingPrice: true },
                },
              },
            },
          },
        });

        if (!order) {
          return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
          );
        }

        result = {
          success: true,
          data: {
            orderNum: order.orderNum,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            totalAmount: order.totalAmount,
            shippingFee: order.shippingFee,
            costAmount: order.costAmount,
            status: order.status,
            trackingNumber: order.trackingNumber,
            cjOrderId: order.cjOrderId,
            paymentStatus: order.paymentStatus,
            items: order.items.map(i => ({
              sku: i.variant?.sku,
              cjVid: i.variant?.cjId,
              quantity: i.quantity,
              price: i.price,
              baseCost: i.variant?.baseCost,
            })),
            createdAt: order.createdAt,
          },
        };
        break;
      }

      // ── Order Created (triggered when customer clicks Place Order) ──────
      case 'order-created': {
        const { orderNum, customerName, customerEmail, customerPhone, totalAmount, status, shippingCountryCode, checkoutUrl } = data || {};
        if (!orderNum) {
          return NextResponse.json(
            { success: false, error: 'orderNum is required' },
            { status: 400 }
          );
        }

        // Send WhatsApp to customer with payment link
        if (customerPhone) {
          const cleanPhone = normalizePhone(customerPhone, shippingCountryCode || '');
          if (cleanPhone.length >= 10) {
            const waMessage = [
              `🛒 *BangParjo Shop — Order Confirmation*`,
              ``,
              `Hi *${customerName || 'there'}*! 👋`,
              ``,
              `Thank you for your order!`,
              `Your order *#${orderNum}* has been received.`,
              ``,
              `🔗 *Complete your payment here:*`,
              `${checkoutUrl}`,
              ``,
              `⏳ *Payment deadline: 24 hours*`,
              `Once paid, we'll process your order right away.`,
              ``,
              `If you have any questions, just reply to this message 😊`,
              ``,
              `— BangParjo Shop`,
            ].join('\n');

            result = await sendCustomWA(cleanPhone, waMessage);
          } else {
            result = { success: false, error: `Invalid phone: ${customerPhone}` };
          }
        } else {
          result = { success: false, error: 'No customer phone provided' };
        }
        break;
      }

      // ── List recent orders ──────────────────────────────────────────────
      case 'list-orders': {
        const { limit = 10, status, days } = data || {};
        const where: any = {};
        if (status) where.status = status;

        // Filter by recency (e.g., orders from last 7 days)
        if (days) {
          const since = new Date();
          since.setDate(since.getDate() - days);
          where.createdAt = { gte: since };
        }

        const orders = await prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 50),
          select: {
            orderNum: true,
            customerName: true,
            customerPhone: true,
            totalAmount: true,
            status: true,
            trackingNumber: true,
            cjOrderId: true,
            createdAt: true,
          },
        });

        result = { success: true, data: orders };
        break;
      }

      // ── Get customer by phone/email ─────────────────────────────────────
      case 'get-customer': {
        const { phone, email } = data || {};
        if (!phone && !email) {
          return NextResponse.json(
            { success: false, error: 'phone or email is required' },
            { status: 400 }
          );
        }

        const where: any[] = [];
        if (phone) where.push({ customerPhone: { contains: phone.replace(/[^0-9]/g, '') } });
        if (email) where.push({ customerEmail: email });

        const orders = await prisma.order.findMany({
          where: { OR: where },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            orderNum: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        });

        const customer = orders.length > 0 ? {
          name: orders[0].customerName,
          email: orders[0].customerEmail,
          phone: orders[0].customerPhone,
          orderCount: orders.length,
          totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          recentOrders: orders.slice(0, 5),
        } : null;

        result = { success: true, data: customer };
        break;
      }

      // ── Check CJ webhook status ─────────────────────────────────────────
      case 'cj-webhook-status': {
        const registeredAt = await prisma.storeSetting.findUnique({
          where: { key: 'CJ_WEBHOOK_REGISTERED_AT' },
        });
        const callbackUrl = await prisma.storeSetting.findUnique({
          where: { key: 'CJ_WEBHOOK_URL' },
        });
        const events = await prisma.storeSetting.findUnique({
          where: { key: 'CJ_WEBHOOK_EVENTS' },
        });

        // Get recent webhook logs
        const recentLogs = await prisma.webhookLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        result = {
          success: true,
          data: {
            registered: !!registeredAt?.value,
            registeredAt: registeredAt?.value || null,
            callbackUrl: callbackUrl?.value || null,
            events: events ? JSON.parse(events.value) : [],
            recentLogs: recentLogs.map(l => ({
              type: l.eventType,
              processed: l.processed,
              error: l.error,
              createdAt: l.createdAt,
            })),
          },
        };
        break;
      }

      // ── Get blog post by slug ───────────────────────────────────────────
      case 'get-blog': {
        const { slug } = data || {};
        if (!slug) {
          return NextResponse.json(
            { success: false, error: 'slug is required' },
            { status: 400 }
          );
        }

        const post = await prisma.blogPost.findUnique({
          where: { slug },
        });

        if (!post) {
          return NextResponse.json(
            { success: false, error: 'Blog post not found' },
            { status: 404 }
          );
        }

        result = {
          success: true,
          data: {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            image: post.image,
            author: post.author,
            published: post.published,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          },
        };
        break;
      }

      // ── Update blog post content (for OpenClaw to fill in content) ──────
      case 'update-blog': {
        const { slug, content, title, excerpt, image, published } = data || {};
        if (!slug) {
          return NextResponse.json(
            { success: false, error: 'slug is required' },
            { status: 400 }
          );
        }

        const existing = await prisma.blogPost.findUnique({ where: { slug } });
        if (!existing) {
          return NextResponse.json(
            { success: false, error: 'Blog post not found' },
            { status: 404 }
          );
        }

        const updateData: any = {};
        if (content !== undefined) updateData.content = content;
        if (title !== undefined) updateData.title = title;
        if (excerpt !== undefined) updateData.excerpt = excerpt;
        if (image !== undefined) updateData.image = image;
        if (published !== undefined) updateData.published = published;

        const updated = await prisma.blogPost.update({
          where: { slug },
          data: updateData,
        });

        result = {
          success: true,
          data: {
            id: updated.id,
            title: updated.title,
            slug: updated.slug,
            excerpt: updated.excerpt,
            content: updated.content,
            image: updated.image,
            author: updated.author,
            published: updated.published,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        };
        break;
      }

      // ── List blog posts ─────────────────────────────────────────────────
      case 'list-blogs': {
        const { limit = 20, published: onlyPublished } = data || {};
        const where: any = {};
        if (onlyPublished !== undefined) where.published = onlyPublished;

        const posts = await prisma.blogPost.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: Math.min(limit, 50),
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            image: true,
            author: true,
            published: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        result = { success: true, data: posts };
        break;
      }

      // ── Analytics: Get order stats ──────────────────────────────────────
      case 'analytics': {
        const { days = 30 } = data || {};

        const since = new Date();
        since.setDate(since.getDate() - days);

        const orders = await prisma.order.findMany({
          where: { createdAt: { gte: since } },
          select: { status: true, totalAmount: true, createdAt: true },
        });

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        const statusBreakdown: Record<string, number> = {};
        orders.forEach(o => {
          statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
        });

        result = {
          success: true,
          data: {
            period: `${days} days`,
            totalOrders,
            totalRevenue,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            statusBreakdown,
          },
        };
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[OpenClaw Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/openclaw
 * Health check endpoint
 */
export async function GET() {
  const allActions = [
    'send-wa',
    'broadcast',
    'send-payment-link',
    'notify-status',
    'get-order',
    'order-created',
    'list-orders',
    'get-customer',
    'cj-webhook-status',
    'get-blog',
    'update-blog',
    'list-blogs',
    'analytics',
  ];

  return NextResponse.json({
    success: true,
    message: 'OpenClaw Webhook API is running',
    version: '2.0.0',
    endpoints: [
      'POST /api/webhooks/openclaw',
      `  Actions: ${allActions.join(', ')}`,
    ],
  });
}
