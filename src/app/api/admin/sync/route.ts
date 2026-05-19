import { NextRequest, NextResponse } from 'next/server';
import { syncAllCategories, syncTrendingProducts } from '@/lib/sync-logic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const type = searchParams.get('type') || 'all';
  const results: any = { success: true };

  try {
    if (type === 'categories' || type === 'all') {
      results.categories = await syncAllCategories();
    }
    
    if (type === 'products' || type === 'all') {
      const pages = parseInt(searchParams.get('pages') || '1');
      results.products = await syncTrendingProducts(pages);
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Sync API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
