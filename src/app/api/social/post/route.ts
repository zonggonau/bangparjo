import { NextRequest, NextResponse } from 'next/server';
import { getProductDetails, parseProductName } from '@/lib/cj';
import { generateProductContent, calculateMarkupPrice } from '@/lib/ai-content';
import { postToSocialMedia, type SocialPostPayload } from '@/lib/social-poster';
import { prisma } from '@/lib/db';

/**
 * POST /api/social/post
 *
 * Body:
 * {
 *   pid: string,                          // CJ Product ID
 *   platforms: ['facebook', 'instagram', 'twitter', 'whatsapp'],
 *   storeBaseUrl: string,                 // e.g. "https://yourstore.com"
 *   forceRegenerate?: boolean             // re-generate AI content even if cached
 * }
 */
export async function POST(req: NextRequest) {
  // Simple admin guard
  const authHeader = req.headers.get('authorization');
  const adminSecret = process.env.AUTH_SECRET;
  if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
    // Also allow dashboard session — check NEXTAUTH cookie approach
    const cookie = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const { pid, platforms = ['facebook', 'instagram', 'twitter'], storeBaseUrl, forceRegenerate = false } = body;

    if (!pid) return NextResponse.json({ error: 'pid is required' }, { status: 400 });

    // 1. Fetch product
    const detail = await getProductDetails(pid);
    if (!detail.success || !detail.data) {
      return NextResponse.json({ error: `Product ${pid} not found` }, { status: 404 });
    }
    const p = detail.data;
    const baseCj = parseFloat((p.variants?.[0] as any)?.variantSellPrice || (p as any).sellPrice || '0');
    const pricing = calculateMarkupPrice(baseCj);

    // 2. Get or generate AI content
    let aiContent: any = null;
    if (!forceRegenerate) {
      try {
        const cached = await prisma.storeSetting.findUnique({ where: { key: `ai_content_${pid}` } });
        if (cached) {
          const parsed = JSON.parse(cached.value);
          if (Date.now() - new Date(parsed.generatedAt).getTime() < 7 * 24 * 60 * 60 * 1000) {
            aiContent = parsed;
          }
        }
      } catch {}
    }

    if (!aiContent) {
      aiContent = await generateProductContent({
        pid,
        name: parseProductName((p as any).productNameEn || p.productName),
        description: p.description,
        categoryName: (p as any).categoryName || '',
        sellPrice: baseCj,
        images: p.productImageSet || [p.productImage],
      });
      // Cache it
      try {
        await prisma.storeSetting.upsert({
          where: { key: `ai_content_${pid}` },
          update: { value: JSON.stringify(aiContent) },
          create: { key: `ai_content_${pid}`, value: JSON.stringify(aiContent) },
        });
      } catch {}
    }

    // 3. Build the slug and buy link
    const slug = `${pid}--${aiContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`;
    const base = storeBaseUrl || process.env.AUTH_URL || 'https://yourstore.com';
    const buyLink = `${base}/buy/${slug}`;
    const imageUrl = (p.productImageSet?.[0] || p.productImage || p.bigImage) as string;

    // 4. Choose the right caption per platform
    const getCaption = (platform: string): string => {
      switch (platform) {
        case 'instagram': return aiContent.captions?.instagram || aiContent.captions?.facebook;
        case 'twitter': return aiContent.captions?.twitter || aiContent.captions?.facebook;
        case 'whatsapp': return `🔥 ${aiContent.title}\n\n${aiContent.captions?.facebook || ''}\n\nBuy now: ${buyLink}`;
        default: return aiContent.captions?.facebook || aiContent.title;
      }
    };

    const getHashtags = (platform: string): string[] => {
      switch (platform) {
        case 'instagram': return aiContent.hashtags?.instagram || [];
        case 'twitter': return aiContent.hashtags?.twitter || [];
        default: return [];
      }
    };

    // 5. Post to each platform (per-platform caption/hashtags)
    const results = await Promise.allSettled(
      (platforms as string[]).map(async (platform) => {
        const payload: SocialPostPayload = {
          message: getCaption(platform),
          hashtags: getHashtags(platform),
          imageUrl: imageUrl || undefined,
          linkUrl: buyLink,
          platforms: [platform as any],
        };
        const res = await postToSocialMedia(payload);
        return res[0];
      })
    );

    const postResults = results.map(r => r.status === 'fulfilled' ? r.value : { platform: 'unknown', success: false, error: (r as any).reason?.message });

    // 6. Log to DB
    try {
      await prisma.storeSetting.upsert({
        where: { key: `social_post_log_${pid}` },
        update: {
          value: JSON.stringify({
            pid,
            title: aiContent.title,
            buyLink,
            platforms: postResults,
            postedAt: new Date().toISOString(),
          }),
        },
        create: {
          key: `social_post_log_${pid}`,
          value: JSON.stringify({
            pid,
            title: aiContent.title,
            buyLink,
            platforms: postResults,
            postedAt: new Date().toISOString(),
          }),
        },
      });
    } catch {}

    const allSuccess = postResults.every(r => r.success);
    return NextResponse.json({
      success: allSuccess,
      partial: !allSuccess && postResults.some(r => r.success),
      pid,
      title: aiContent.title,
      buyLink,
      sellingPrice: pricing.sellingPrice,
      discount: pricing.discount,
      results: postResults,
    });
  } catch (err: any) {
    console.error('[Social Post Error]:', err);
    return NextResponse.json({ error: err.message || 'Post failed' }, { status: 500 });
  }
}
