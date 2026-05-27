import { NextResponse } from 'next/server';
import { getShippingFeeBySku } from '@/lib/cj-api';
import { calculateShippingFee } from '@/lib/pricing';
import { getCachedStoreSettings } from '@/lib/server-settings';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  const quantity = parseInt(searchParams.get('quantity') || '1', 10);
  const country = searchParams.get('country') || 'ID';
  // subtotal di sini adalah harga jual (setelah margin), bukan harga CJ mentah
  const subtotal = parseFloat(searchParams.get('subtotal') || '10');

  if (!sku) {
    return NextResponse.json({ success: false, message: 'Missing sku parameter' }, { status: 400 });
  }

  try {
    // Ambil settings dari DB agar markup konsisten dengan halaman checkout
    const settings = await getCachedStoreSettings();

    const res = await getShippingFeeBySku({
      products: [{ sku, quantity, price: subtotal }],
      endCountryCode: country,
    });

    if (res.success && res.data) {
      const rates = res.data.map((rate: any) => {
        // Terapkan calculateShippingFee SAMA PERSIS seperti di checkout
        const finalPrice = calculateShippingFee(rate.logisticPrice, subtotal, settings);
        return {
          logisticName: rate.logisticName,
          price: finalPrice,
          rawCjPrice: rate.logisticPrice, // simpan harga CJ asli untuk debugging
          formattedPrice: finalPrice === 0 ? 'FREE' : `$${finalPrice.toFixed(2)}`,
          estimatedDays: rate.logisticAging + ' days',
        };
      });
      return NextResponse.json({ success: true, data: rates });
    }

    return NextResponse.json({ success: false, message: res.message || 'Failed to fetch shipping rates' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
