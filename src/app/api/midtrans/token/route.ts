import { NextResponse } from 'next/server';
// @ts-ignore
import Midtrans from 'midtrans-client';

const snap = new Midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
});

export async function POST(req: Request) {
  try {
    const { orderId, amount, customerDetails } = await req.json();
    // amount is already in IDR (converted on the frontend using real-time rate)
    const idrAmount = Math.round(amount);

    // Append a unique suffix to orderId for Midtrans (to allow retries)
    // Format: ORD-123-171585...
    const midtransOrderId = `${orderId}-${Date.now()}`;

    const parameter = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: idrAmount,
      },
      customer_details: {
        first_name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      credit_card: {
        secure: true
      },
      usage_limit: 1
    };

    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json({ success: true, token: transaction.token });
  } catch (error: any) {
    console.error('Midtrans Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
