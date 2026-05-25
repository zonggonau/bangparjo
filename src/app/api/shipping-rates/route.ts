import { NextResponse } from 'next/server';
import { getShippingFeeBySku } from '@/lib/cj-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  const quantity = parseInt(searchParams.get('quantity') || '1', 10);
  const country = searchParams.get('country') || 'ID';
  const subtotal = parseFloat(searchParams.get('subtotal') || '10');

  if (!sku) {
    return NextResponse.json({ success: false, message: 'Missing sku parameter' }, { status: 400 });
  }

  try {
    const res = await getShippingFeeBySku({
      products: [{ sku, quantity, price: subtotal }],
      endCountryCode: country,
    });

    if (res.success && res.data) {
      const rates = res.data.map((rate: any) => ({
        logisticName: rate.logisticName,
        price: rate.logisticPrice,
        formattedPrice: `$${rate.logisticPrice.toFixed(2)}`,
        estimatedDays: rate.logisticAging + ' days',
      }));
      return NextResponse.json({ success: true, data: rates });
    }

    return NextResponse.json({ success: false, message: res.message || 'Failed to fetch shipping rates' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
