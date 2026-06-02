'use server';

import { prisma } from '@/lib/db';
import { getTrackingInfo, deleteOrder, confirmOrder } from '@/lib/cj';
import { processFulfillment } from '@/lib/fulfillment';
import { auth } from '@/auth';

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

export async function getAdminOrdersAction() {
  try {
    await checkAdmin();
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });
    return { success: true, data: orders };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch orders' };
  }
}

export async function syncAdminOrderAction(orderId: string) {
  try {
    await checkAdmin();
    if (!orderId) return { success: false, error: 'Order ID is required' };

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order?.cjOrderId) {
      return { success: false, error: 'Order not linked to CJ' };
    }

    const cjRes = await getTrackingInfo(order.cjOrderId);
    if (cjRes.success) {
      const cjData = cjRes.data as any;
      
      const statusMap: Record<string, string> = {
        '1': 'PENDING',
        '2': 'PAID',
        '3': 'PROCESSING',
        '4': 'SHIPPED',
        '5': 'DELIVERED',
        '6': 'CANCELLED'
      };

      const newStatus = statusMap[String(cjData.status)] || order.status;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          trackingNumber: cjData.trackingNumber || order.trackingNumber,
          cjResponse: cjData
        }
      });

      return { success: true, status: newStatus };
    }

    return { success: false, error: cjRes.message || 'CJ Sync Failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fulfillAdminOrderAction(orderNum: string) {
  try {
    await checkAdmin();
    if (!orderNum) return { success: false, error: 'orderNum is required' };
    const result = await processFulfillment(orderNum);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCjOrderAction(cjOrderId: string) {
  try {
    await checkAdmin();
    if (!cjOrderId) return { success: false, error: 'CJ Order ID is required' };
    const res = await deleteOrder(cjOrderId);
    return res;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function confirmCjOrderAction(cjOrderId: string) {
  try {
    await checkAdmin();
    if (!cjOrderId) return { success: false, error: 'CJ Order ID is required' };
    const res = await confirmOrder({ orderId: cjOrderId });
    return res;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markOrderAsPaidAction(orderId: string) {
  try {
    await checkAdmin();
    await prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
    return { success: true };
  } catch(e: any) {
    return { success: false, message: e.message };
  }
}

