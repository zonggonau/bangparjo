import { NextResponse } from 'next/server';
import { cjFetch } from '@/lib/cj-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ success: false, message: 'Missing endpoint' }, { status: 400 });
  }

  try {
    const resData = await cjFetch(endpoint, {
      method: 'GET',
    });

    if (!resData.success && resData.message?.toLowerCase().includes('qps')) {
      return NextResponse.json(
        { success: false, result: false, message: resData.message, data: null },
        { status: 429 }
      );
    }

    return NextResponse.json(resData);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { endpoint, method, data, headers } = body;

  try {
    const resData = await cjFetch(endpoint, {
      method: method || 'GET',
      headers: headers,
      body: method !== 'GET' ? JSON.stringify(data) : undefined,
    });

    // Propagate CJ rate-limit responses cleanly
    if (!resData.success && resData.message?.toLowerCase().includes('qps')) {
      return NextResponse.json(
        { success: false, result: false, message: resData.message, data: null },
        { status: 429 }
      );
    }

    return NextResponse.json(resData);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
