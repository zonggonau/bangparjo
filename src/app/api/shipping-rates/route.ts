import { NextResponse } from 'next/server';
import { getBestShippingRates } from '@/lib/logistics';
import { getShippingFee } from '@/lib/cj-api';
import { calculateShippingFee, getDBStoreSettings } from '@/lib/pricing';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productsParam = searchParams.get('products');
  const country = searchParams.get('country') || 'ID';
  const subtotal = parseFloat(searchParams.get('subtotal') || '0');

  let products: Array<{ vid: string; quantity: number }> = [];

  if (productsParam) {
    try {
      products = JSON.parse(productsParam);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid products format' }, { status: 400 });
    }
  } else {
    const vid = searchParams.get('vid');
    const quantity = parseInt(searchParams.get('quantity') || '1');
    if (vid) {
      products = [{ vid, quantity }];
    }
  }

  if (products.length === 0) {
    return NextResponse.json({ success: false, error: 'Missing products' }, { status: 400 });
  }

  const settings = await getDBStoreSettings();
  
  // getBestShippingRates only supports single vid currently. 
  // Let's use getShippingFee directly here for multiple products.
  const res = await getShippingFee({
    products,
    endCountryCode: country
  });

  if (!res.success || !res.data) {
     return NextResponse.json({ success: false, error: res.message || 'No shipping methods' });
  }

  const rates = res.data;
  
  // Apply markup and format
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

