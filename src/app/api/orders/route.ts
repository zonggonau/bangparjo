import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { orderNum, customerEmail, customerName, customerPhone, totalAmount, costAmount, status, orderData } = await req.json();
    if (!orderNum) {
      return NextResponse.json({ success: false, message: 'orderNum is required' }, { status: 400 });
    }
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
      },
      create: {
        orderNum,
        customerEmail,
        customerName,
        customerPhone,
        totalAmount,
        costAmount,
        status: status || 'UNPAID',
        orderData: typeof orderData === 'string' ? JSON.parse(orderData) : orderData,
      },
    });

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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}
