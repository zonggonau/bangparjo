import { NextResponse } from 'next/server';
import { getExchangeRateIDR } from '@/lib/currency';

export async function GET() {
  try {
    const rate = await getExchangeRateIDR();
    return NextResponse.json({ success: true, rate });
  } catch (error: any) {
    console.error('[Currency API] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
