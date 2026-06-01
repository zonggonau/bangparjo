import { NextResponse } from 'next/server';
import { cjFetch } from '@/lib/cj-api';

// Cache reviews per product in Redis for 24 hours to avoid QPS hammering
async function getCachedReviews(cacheKey: string) {
  try {
    const { redis: r } = await import('@/lib/redis');
    if (!r || r.status !== 'ready') return null;
    const data = await r.get(cacheKey);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function setCachedReviews(cacheKey: string, data: any) {
  try {
    const { redis: r } = await import('@/lib/redis');
    if (!r || r.status !== 'ready') return;
    // Cache for 24 hours — reviews rarely change
    await r.set(cacheKey, JSON.stringify(data), 'EX', 86400);
  } catch {
    // Ignore cache errors
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pid = searchParams.get('pid');
  const pageNum = searchParams.get('pageNum') || '1';
  const pageSize = searchParams.get('pageSize') || '5';
  const score = searchParams.get('score');

  if (!pid) {
    return NextResponse.json({ success: false, message: 'Missing pid' }, { status: 400 });
  }

  const cacheKey = `cj_reviews_${pid}_p${pageNum}_s${score || 'all'}_ps${pageSize}`;

  // 1. Try cache first
  const cached = await getCachedReviews(cacheKey);
  if (cached) {
    return NextResponse.json({ success: true, data: cached, cached: true });
  }

  // 2. Fetch from CJ with a hard 5-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const params = new URLSearchParams({ pid, pageNum, pageSize });
    if (score) params.set('score', score);

    const res = await cjFetch<any>(`/api2.0/v1/product/productComments?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.success && res.data) {
      // Cache the result
      await setCachedReviews(cacheKey, res.data);
      return NextResponse.json({ success: true, data: res.data });
    }

    // QPS or other failure — return empty gracefully, don't error out the page
    return NextResponse.json({ success: true, data: { list: [], total: '0' }, qpsLimited: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      // Timed out — return empty gracefully
      return NextResponse.json({ success: true, data: { list: [], total: '0' }, timedOut: true });
    }
    return NextResponse.json({ success: true, data: { list: [], total: '0' }, error: err.message });
  }
}
