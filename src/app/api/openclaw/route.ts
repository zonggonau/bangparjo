/**
 * OpenClaw API Gateway
 *
 * Endpoint untuk mengirim notifikasi WhatsApp dari client-side components.
 * Semua request diverifikasi dan diteruskan ke OpenClaw di localhost.
 *
 * POST /api/openclaw
 * Body: { action: string, data: object }
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  notifyOrderCreated,
  notifyPaymentReceived,
  notifyShipped,
  notifyContactAdmin,
  sendCustomWA,
} from '@/lib/openclaw';

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json();

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'notify-order':
        result = await notifyOrderCreated(data);
        break;

      case 'notify-payment':
        result = await notifyPaymentReceived(data);
        break;

      case 'notify-shipping':
        result = await notifyShipped(data);
        break;

      case 'contact-admin':
        result = await notifyContactAdmin(data);
        break;

      case 'chat-ai':
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const aiUrl = baseUrl.replace(/\/+$/, '') + '/api/ai/chat';
          const aiRes = await fetch(aiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(30000)
          });
          result = await aiRes.json();
        } catch (e: any) {
          console.error('[Chat-AI] fetch error:', e.message);
          result = { success: false, text: "Parjo AI is currently unavailable. Please try again later. 😊" };
        }
        break;

      case 'send-wa':
        if (!data?.target || !data?.message) {
          return NextResponse.json({ success: false, error: 'target and message required' }, { status: 400 });
        }
        result = await sendCustomWA(data.target, data.message);
        break;

      case 'get-product':
        if (!data?.pid && !data?.keyword) {
          return NextResponse.json({ success: false, error: 'pid or keyword required' }, { status: 400 });
        }
        if (data?.pid) {
          const product = await prisma.product.findUnique({
            where: { cjId: data.pid },
            include: { variants: true, category: true }
          });
          if (!product) {
            return NextResponse.json({ success: false, error: 'Product not found' });
          }
          result = {
            success: true,
            data: {
              name: product.name,
              images: product.images,
              category: product.category?.name || null,
              variants: product.variants.map(v => ({
                vid: v.cjId,
                sku: v.sku,
                color: v.color,
                size: v.size,
                weight: v.weight,
                retailPrice: v.sellingPrice || v.baseCost,
                inventory: v.inventory,
                image: v.image,
              })),
              variantCount: product.variantCount,
            }
          };
        } else {
          const products = await prisma.product.findMany({
            where: {
              status: 'ACTIVE',
              name: { contains: data.keyword, mode: 'insensitive' },
            },
            include: { variants: { take: 1 }, category: true },
            take: 10,
            orderBy: { updatedAt: 'desc' },
          });
          result = {
            success: true,
            data: products.map(p => ({
              pid: p.cjId,
              name: p.name,
              image: p.images?.[0] || '',
              category: p.category?.name || null,
              retailPrice: p.variants?.[0]?.sellingPrice || p.variants?.[0]?.baseCost || 0,
              inventory: p.variants?.[0]?.inventory || 0,
            })),
          };
        }
        break;

      case 'get-order':
        if (!data?.orderNum) {
          return NextResponse.json({ success: false, error: 'orderNum required' }, { status: 400 });
        }
        const order = await prisma.order.findUnique({ where: { orderNum: data.orderNum } });
        if (!order) {
          return NextResponse.json({ success: false, error: 'Order not found' });
        }
        result = {
          success: true,
          data: {
            orderNum: order.orderNum,
            status: order.status,
            customerName: order.customerName,
            totalAmount: order.totalAmount,
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
          }
        };
        break;

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[OpenClaw API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
