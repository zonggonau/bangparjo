import { NextRequest, NextResponse } from 'next/server';
import { generateProductContent, scoreProduct, calculateMarkupPrice, type ProductInput } from '@/lib/ai-content';
import { getProductDetails } from '@/lib/cj-api';
import { prisma } from '@/lib/db';

/**
 * POST /api/ai/generate-content
 * Body: { pid: string, mode?: 'full' | 'score' | 'price-only' }
 *
 * GET /api/ai/generate-content?pid=xxx&mode=full
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pid, mode = 'full', productData } = body;

    if (!pid && !productData) {
      return NextResponse.json({ error: 'pid or productData is required' }, { status: 400 });
    }

    let product: ProductInput;

    if (productData) {
      // Direct product data provided (for bulk processing)
      product = productData;
    } else {
      // Fetch from CJ API / DB cache
      const detail = await getProductDetails(pid);
      if (!detail.success || !detail.data) {
        return NextResponse.json({ error: `Product ${pid} not found` }, { status: 404 });
      }
      const p = detail.data;
      const baseVariantPrice = p.variants?.[0]?.variantSellPrice ?? (p as any).sellPrice ?? 0;

      product = {
        pid: p.pid,
        name: (p as any).productNameEn || p.productName,
        description: p.description,
        categoryName: (p as any).categoryName || '',
        sellPrice: typeof baseVariantPrice === 'string' ? parseFloat(baseVariantPrice) : baseVariantPrice,
        images: p.productImageSet || [p.productImage],
      };
    }

    // Mode: price-only — fast, no AI call
    if (mode === 'price-only') {
      const pricing = calculateMarkupPrice(product.sellPrice, 0);
      return NextResponse.json({ success: true, data: { pid: product.pid, ...pricing } });
    }

    // Mode: score — quick viral scoring
    if (mode === 'score') {
      const score = await scoreProduct(product);
      return NextResponse.json({ success: true, data: { pid: product.pid, ...score } });
    }

    // Mode: full — complete content generation
    const content = await generateProductContent(product);

    // Optionally persist generated content to DB
    try {
      await prisma.storeSetting.upsert({
        where: { key: `ai_content_${product.pid}` },
        update: { value: JSON.stringify(content) },
        create: { key: `ai_content_${product.pid}`, value: JSON.stringify(content) },
      });
    } catch (dbErr) {
      console.warn('[AI Content] DB save failed:', dbErr);
    }

    return NextResponse.json({ success: true, data: { pid: product.pid, ...content } });
  } catch (err: any) {
    console.error('[AI Content Generator Error]:', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pid = searchParams.get('pid');
  const mode = searchParams.get('mode') || 'full';

  if (!pid) {
    return NextResponse.json({ error: 'pid is required' }, { status: 400 });
  }

  // Check cached AI content first
  if (mode === 'full') {
    try {
      const cached = await prisma.storeSetting.findUnique({
        where: { key: `ai_content_${pid}` },
      });
      if (cached) {
        const parsed = JSON.parse(cached.value);
        // Serve cache if less than 7 days old
        const generatedAt = new Date(parsed.generatedAt).getTime();
        if (Date.now() - generatedAt < 7 * 24 * 60 * 60 * 1000) {
          return NextResponse.json({ success: true, data: { pid, ...parsed, fromCache: true } });
        }
      }
    } catch {}
  }

  // Forward to POST handler
  const fakeReq = new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pid, mode }),
  });
  return POST(new NextRequest(fakeReq));
}
