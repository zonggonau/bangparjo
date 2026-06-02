'use server';

import { prisma } from '@/lib/db';
import { cjFetch } from '@/lib/cj';
import { auth } from '@/auth';

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

export async function getDashboardAnalyticsAction() {
  try {
    await checkAdmin();
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalCost = orders.reduce((sum, o) => {
      const itemCost = o.items.reduce((s, i) => s + (i.variant?.baseCost || 0) * i.quantity, 0);
      return sum + itemCost;
    }, 0);
    const totalProfit = totalRevenue - totalCost - orders.reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);

    const pendingOrders = orders.filter(o => ['UNPAID', 'PENDING', 'PROCESSING'].includes(o.status?.toUpperCase() || '')).length;
    const paidOrders = orders.filter(o => o.status?.toUpperCase() === 'PAID').length;
    const shippedOrders = orders.filter(o => o.status?.toUpperCase() === 'SHIPPED').length;
    const deliveredOrders = orders.filter(o => o.status?.toUpperCase() === 'DELIVERED').length;
    const cancelledOrders = orders.filter(o => o.status?.toUpperCase() === 'CANCELLED').length;

    const productSales = new Map<string, { name: string; image: string; quantity: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const p = item.variant?.product;
        if (!p) continue;
        const existing = productSales.get(p.id) || { name: p.name || 'Unknown', image: (p.images?.[0]) || '', quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += (item.price || 0) * item.quantity;
        productSales.set(p.id, existing);
      }
    }
    const topProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentOrders = orders.slice(0, 10).map(o => ({
      id: o.id,
      orderNum: o.orderNum,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
    }));

    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = orders.filter(o => {
        if (!o.createdAt) return false;
        const d = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt);
        return d.toISOString().split('T')[0] === dateStr;
      });
      dailyRevenue.push({
        date: dateStr,
        revenue: dayOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0),
        orders: dayOrders.length,
      });
    }

    const lowStockVariants = await prisma.variant.findMany({
      where: { inventory: { lte: 5 } },
      select: { id: true },
    });

    const pointsRemaining = await prisma.storeSetting.findUnique({ where: { key: 'CJ_POINTS_REMAINING' } });
    const pointsUsed = await prisma.storeSetting.findUnique({ where: { key: 'CJ_POINTS_USED' } });
    const pointsTotal = await prisma.storeSetting.findUnique({ where: { key: 'CJ_POINTS_TOTAL' } });

    return {
      success: true,
      data: {
        cjPoints: {
          remaining: parseInt(pointsRemaining?.value || '0'),
          used: parseInt(pointsUsed?.value || '0'),
          total: parseInt(pointsTotal?.value || '50000'),
        },
        totalOrders,
        totalRevenue,
        totalCost,
        totalProfit,
        pendingOrders,
        paidOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        lowStockProducts: lowStockVariants.length,
        topProducts,
        recentOrders,
        dailyRevenue,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCjBalanceAction() {
  try {
    await checkAdmin();
    const res = await cjFetch('/v1/shopping/pay/getBalance', { method: 'GET' });
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function registerCJWebhookAction(
  baseUrl: string,
  enabledEvents: { product: boolean; stock: boolean; order: boolean; logistics: boolean }
) {
  try {
    await checkAdmin();
    const { setWebhook } = await import('@/lib/cj-api');
    const callbackUrl = `${baseUrl.replace(/\/+$/, '')}/api/cj-webhook`;
    
    const res = await setWebhook({
      product: {
        type: enabledEvents.product ? 'ENABLE' : 'CANCEL',
        callbackUrls: [callbackUrl],
      },
      stock: {
        type: enabledEvents.stock ? 'ENABLE' : 'CANCEL',
        callbackUrls: [callbackUrl],
      },
      order: {
        type: enabledEvents.order ? 'ENABLE' : 'CANCEL',
        callbackUrls: [callbackUrl],
      },
      logistics: {
        type: enabledEvents.logistics ? 'ENABLE' : 'CANCEL',
        callbackUrls: [callbackUrl],
      },
    });

    if (res.success) {
      // Save webhook configuration in StoreSetting table
      await prisma.storeSetting.upsert({
        where: { key: 'CJ_WEBHOOK_URL' },
        update: { value: callbackUrl },
        create: { key: 'CJ_WEBHOOK_URL', value: callbackUrl },
      });

      await prisma.storeSetting.upsert({
        where: { key: 'CJ_WEBHOOK_REGISTERED_AT' },
        update: { value: new Date().toISOString() },
        create: { key: 'CJ_WEBHOOK_REGISTERED_AT', value: new Date().toISOString() },
      });

      const activeEvents = Object.keys(enabledEvents).filter(
        (key) => enabledEvents[key as keyof typeof enabledEvents]
      );
      await prisma.storeSetting.upsert({
        where: { key: 'CJ_WEBHOOK_EVENTS' },
        update: { value: JSON.stringify(activeEvents) },
        create: { key: 'CJ_WEBHOOK_EVENTS', value: JSON.stringify(activeEvents) },
      });

      try {
        const { invalidateCache } = await import('@/lib/redis');
        await invalidateCache('store:settings');
      } catch (e) {
        console.warn('[Webhook] Failed to invalidate Redis cache:', e);
      }

      return { success: true, message: 'Webhook registered successfully with CJ API.' };
    } else {
      return { success: false, message: res.message || 'Failed to register webhook.' };
    }
  } catch (error: any) {
    console.error('[Webhook Registration Error]:', error);
    return { success: false, message: error.message };
  }
}
