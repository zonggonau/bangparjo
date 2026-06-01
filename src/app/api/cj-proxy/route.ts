import { NextResponse } from 'next/server';
import { cjProxyAction } from '@/lib/actions-catalog';

export async function GET(request: Request) {
  const urlStr = request.url;
  const idx = urlStr.indexOf('?endpoint=');
  if (idx === -1) {
    return NextResponse.json({ success: false, message: 'Missing endpoint parameter' }, { status: 400 });
  }
  
  // Extract the exact endpoint string preserving any query parameters it contains
  const endpoint = urlStr.substring(idx + 10);
  
  try {
    const res: any = await cjProxyAction(endpoint, { method: 'GET' });
    return NextResponse.json(res, { status: res.status || 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, method = 'POST', data } = body;
    
    if (!endpoint) {
      return NextResponse.json({ success: false, message: 'Missing endpoint' }, { status: 400 });
    }

    const res: any = await cjProxyAction(endpoint, {
      method,
      body: data,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return NextResponse.json(res, { status: res.status || 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
