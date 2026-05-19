import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Basic stats
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

    // Status breakdown
    const pendingOrders = orders.filter(o => ['UNPAID', 'PENDING', 'PROCESSING'].includes(o.status?.toUpperCase() || '')).length;
    const paidOrders = orders.filter(o => o.status?.toUpperCase() === 'PAID').length;
    const shippedOrders = orders.filter(o => o.status?.toUpperCase() === 'SHIPPED').length;
    const deliveredOrders = orders.filter(o => o.status?.toUpperCase() === 'DELIVERED').length;
    const cancelledOrders = orders.filter(o => o.status?.toUpperCase() === 'CANCELLED').length;

    // Top products
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

    // Recent orders (last 10)
    const recentOrders = orders.slice(0, 10).map(o => ({
      id: o.id,
      orderNum: o.orderNum,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
    }));

    // Daily revenue (last 7 days)
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

    // Low stock count
    const lowStockVariants = await prisma.variant.findMany({
      where: { inventory: { lte: 5 } },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
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
    });
  } catch (error: any) {
    console.error('[Analytics Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
