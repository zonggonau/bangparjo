import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const isPlaceholder = !secretKey || secretKey.includes('your_stripe_secret_key');

  if (isPlaceholder) {
    return NextResponse.json({ 
      success: false, 
      error: 'Stripe Secret Key is not configured. Please set STRIPE_SECRET_KEY in .env.local' 
    }, { status: 500 });
  }

  const stripe = new Stripe(secretKey!);

  try {
    const { orderId, amount, customerEmail } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Order ${orderId}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${req.headers.get('origin')}/checkout/${orderId}`,
      customer_email: customerEmail,
      metadata: {
        orderId: orderId,
      },
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
