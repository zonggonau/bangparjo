import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe Secret Key not configured' }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (orderId) {
      console.log(`[Stripe Webhook] Order ${orderId} marked as PAID`);
      await prisma.order.update({
        where: { orderNum: orderId },
        data: { status: 'PAID' },
      });
    }
  }

  return NextResponse.json({ received: true });
}
