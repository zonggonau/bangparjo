import { NextResponse } from 'next/server';
import { cjFetch } from '@/lib/cj-api';

// GET /api/admin/balance — fetch CJ wallet balance
export async function GET() {
  try {
    const res = await cjFetch('/v1/shopping/pay/getBalance', { method: 'GET' });
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
