import { NextResponse } from 'next/server';
import { getShippingFee, getShippingFeeBySku } from '@/lib/cj-api';
import { calculateShippingFee, getDBStoreSettings } from '@/lib/pricing';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productsParam = searchParams.get('products');
  const country = searchParams.get('country') || 'ID';
  const subtotal = parseFloat(searchParams.get('subtotal') || '0');
  const useSku = searchParams.get('sku'); // single SKU mode
  const vid = searchParams.get('vid');

  const settings = await getDBStoreSettings();

  // ── Try SKU-based lookup first (more reliable) ──────────────────────────
  if (useSku) {
    const quantity = parseInt(searchParams.get('quantity') || '1');
    const weight = parseFloat(searchParams.get('weight') || '0');
    const price = subtotal / quantity;

    const skuRes = await getShippingFeeBySku({
      products: [{ sku: useSku, quantity, weight: weight || 200, price: price || 10 }],
      endCountryCode: country,
    });

    if (skuRes.success && skuRes.data && skuRes.data.length > 0) {
      const finalRates = skuRes.data.map(rate => {
        const finalPrice = calculateShippingFee(rate.logisticPrice, subtotal, settings);
        return {
          ...rate,
          logisticPrice: finalPrice,
          estimatedDays: rate.logisticAging ? `${rate.logisticAging} days` : '',
          formattedPrice: finalPrice === 0 ? 'FREE' : `USD ${finalPrice.toFixed(2)}`
        };
      });
      return NextResponse.json({ success: true, data: finalRates });
    }
    // If SKU fails, fall through to try VID method
  }

  // ── Parse products ──────────────────────────────────────────────────────
  let products: Array<{ vid: string; quantity: number }> = [];

  if (productsParam) {
    try {
      products = JSON.parse(productsParam);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid products format' }, { status: 400 });
    }
  } else if (vid) {
    const quantity = parseInt(searchParams.get('quantity') || '1');
    products = [{ vid, quantity }];
  }

  if (products.length === 0) {
    return NextResponse.json({ success: false, error: 'Missing products or sku' }, { status: 400 });
  }

  // ── Fallback ke VID-based API ───────────────────────────────────────────
  const res = await getShippingFee({ products, endCountryCode: country });

  if (!res.success || !res.data) {
    // Ultimate fallback: multiple shipping options
    const fallbackRates = [
      { logisticName: 'Economy Shipping', logisticPrice: 4.50, logisticAging: '20-30' },
      { logisticName: 'Standard Shipping', logisticPrice: 7.00, logisticAging: '15-25' },
      { logisticName: 'Express Shipping', logisticPrice: 15.00, logisticAging: '7-12' },
    ];
    const finalFallback = fallbackRates.map(rate => {
      const finalPrice = calculateShippingFee(rate.logisticPrice, subtotal, settings);
      return {
        ...rate,
        logisticPrice: finalPrice,
        estimatedDays: rate.logisticAging ? `${rate.logisticAging} days` : '',
        formattedPrice: finalPrice === 0 ? 'FREE' : `USD ${finalPrice.toFixed(2)}`
      };
    });
    return NextResponse.json({ success: true, data: finalFallback });
  }

  const rates = res.data;
  const finalRates = rates.map(rate => {
    const finalPrice = calculateShippingFee(rate.logisticPrice, subtotal, settings);
    return {
      ...rate,
      logisticPrice: finalPrice,
      estimatedDays: rate.logisticAging ? `${rate.logisticAging} days` : '',
      formattedPrice: finalPrice === 0 ? 'FREE' : `USD ${finalPrice.toFixed(2)}`
    };
  });

  return NextResponse.json({ success: true, data: finalRates });
}
