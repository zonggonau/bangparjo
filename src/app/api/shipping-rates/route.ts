import { NextResponse } from 'next/server';
import { getShippingFeeBySku, cjFetch } from '@/lib/cj-api';
import { calculateShippingFee } from '@/lib/pricing';
import { getCachedStoreSettings } from '@/lib/server-settings';

export const dynamic = 'force-dynamic';

/** Try multiple CJ freight APIs and return whatever works */
async function tryShippingApis(params: { sku: string; weight: number; country: string; subtotal: number }) {
  // 1. SKU-based (freightCalculateTip)
  const tipRes = await getShippingFeeBySku({
    products: [{ sku: params.sku, quantity: 1, price: params.subtotal }],
    endCountryCode: params.country,
  });
  if (tipRes.success && tipRes.data && tipRes.data.length > 0) return tipRes.data;

  // 2. Partner freight
  try {
    const partnerRes = await cjFetch<any>('/api2.0/v1/logistic/partnerFreightCalculate', {
      method: 'POST',
      body: JSON.stringify({
        fromCountryCode: 'CN',
        endCountryCode: params.country,
        weight: params.weight,
        totalGoodsAmount: params.subtotal,
      }),
      maxRetries: 0,
    });
    if (partnerRes.success && partnerRes.data) {
      const items = Array.isArray(partnerRes.data) ? partnerRes.data : [partnerRes.data];
      return items.map((i: any) => ({
        logisticName: i.channelNameEn || i.logisticName || 'Standard Shipping',
        logisticPrice: i.totalFee || i.freight || i.logisticPrice || 0,
        logisticAging: i.estimatedDays || i.deliveryTime || '10-20',
      }));
    }
  } catch {}

  // 3. Return empty — shipping will be calculated at checkout
  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  const quantity = parseInt(searchParams.get('quantity') || '1', 10);
  const country = searchParams.get('country') || 'ID';
  const subtotal = parseFloat(searchParams.get('subtotal') || '10');
  const weight = parseInt(searchParams.get('weight') || '500', 10);

  if (!sku) {
    return NextResponse.json({ success: false, message: 'Missing sku parameter' }, { status: 400 });
  }

  try {
    const settings = await getCachedStoreSettings();
    const rates = await tryShippingApis({ sku, weight, country, subtotal });

    if (rates.length > 0) {
      const mapped = rates.map((rate: any) => {
        const price = calculateShippingFee(rate.logisticPrice || 0, subtotal, settings);
        return {
          logisticName: rate.logisticName,
          price,
          rawCjPrice: rate.logisticPrice,
          formattedPrice: price === 0 ? 'FREE' : `$${price.toFixed(2)}`,
          estimatedDays: rate.logisticAging ? `${rate.logisticAging}`.includes('day') ? rate.logisticAging : `${rate.logisticAging} days` : 'N/A',
        };
      });
      return NextResponse.json({ success: true, data: mapped });
    }

    // Fallback: estimasi shipping berdasarkan weight
    const baseShipping = 5 + Math.ceil(weight / 1000) * 1;
    const finalPrice = calculateShippingFee(baseShipping, subtotal, settings);
    return NextResponse.json({ success: true, data: [{
      logisticName: 'Standard Shipping',
      price: finalPrice,
      rawCjPrice: baseShipping,
      formattedPrice: finalPrice === 0 ? 'FREE' : `$${finalPrice.toFixed(2)}`,
      estimatedDays: 'Estimated at checkout',
    }]});
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
