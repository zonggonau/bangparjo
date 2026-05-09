import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Internal Test Route for Webhooks
 * POST /api/admin/test-webhook
 * Body: { type: 'ORDER' | 'LOGISTIC' | 'STOCK', orderNum?: string }
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const { type, orderNum, cjOrderId, variantId, stock } = await req.json();
    
    // Simulate what CJ would send to our webhook
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/cj-webhook`;

    let payload: any = {
      messageId: `TEST-${Date.now()}`,
      type: type,
      messageType: 'UPDATE',
      params: {}
    };

    if (type === 'ORDER') {
      payload.params = {
        orderNumber: orderNum || 'ORD-TEST-123',
        cjOrderId: cjOrderId || 'CJ-TEST-456',
        orderStatus: 'SHIPPED'
      };
    } else if (type === 'LOGISTIC') {
      payload.params = {
        orderId: cjOrderId || 'CJ-TEST-456',
        trackingNumber: 'TRACK-TEST-789',
        logisticName: 'CJPacket Ordinary'
      };
    } else if (type === 'STOCK') {
      payload.params = {
        [variantId || 'VID-123']: [
          {
            vid: variantId || 'VID-123',
            areaEn: 'Test Warehouse',
            storageNum: stock || 99
          }
        ]
      };
    }

    // Call our own webhook route
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    return NextResponse.json({ 
      mockPayload: payload,
      webhookResponse: result 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
