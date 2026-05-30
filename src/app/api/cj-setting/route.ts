import { NextResponse } from 'next/server';
import { cjFetch } from '@/lib/cj';

export async function GET() {
  try {
    const settingsData = await cjFetch('/v1/setting/get');
    return NextResponse.json(settingsData);
  } catch (error) {
    console.error('CJ Settings API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
