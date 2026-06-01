import { PrismaClient } from '@prisma/client';
import { createOrder } from './src/lib/cj-api';

const prisma = new PrismaClient();

async function test() {
  const order = await prisma.order.findUnique({ where: { orderNum: 'ORD-1779812549717' } });
  if (!order || !order.orderData) throw new Error('Order not found');
  
  const basePayload = {
    ...(order.orderData as any),
    payType: 3, 
    orderNumber: (order.orderData as any).orderNumber + '-t4', 
  };

  // 1. Try with iossOption
  try {
    const res1 = await createOrder({
      ...basePayload,
      iossOption: 1, 
    });
    console.log('Result with iossOption: 1 =>', res1);
    if (res1.success || res1.result) return;
  } catch(e: any) { console.error('iossOption 1 error:', e.message); }

  // 2. Try with iossOption as string? No, just try iossOption: 1
}

test().finally(() => prisma.$disconnect());
