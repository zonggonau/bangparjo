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

      case 'send-wa':
        if (!data?.target || !data?.message) {
          return NextResponse.json({ success: false, error: 'target and message required' }, { status: 400 });
        }
        result = await sendCustomWA(data.target, data.message);
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
