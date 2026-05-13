import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateProductContent, calculateMarkupPrice } from '@/lib/ai-content';
import { postToSocialMedia, type SocialPostPayload } from '@/lib/social-poster';
import { getProductDetails, parseProductName } from '@/lib/cj-api';

/**
 * GET /api/cron/social-post
 *
 * Called by:
 * - Vercel Cron (vercel.json)
 * - n8n HTTP Request node (every hour)
 * - PM2 cron job
 *
 * Processes all PENDING scheduled posts whose scheduledAt <= now.
 *
 * n8n Setup:
 *   Trigger: Schedule (every hour at 0, 7, 12, 19, 22 o'clock)
 *   Node: HTTP Request
 *     Method: GET
 *     URL: https://yourstore.com/api/cron/social-post
 *     Headers: Authorization: Bearer <AUTH_SECRET>
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  const secret = process.env.AUTH_SECRET || process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const storeBaseUrl = process.env.AUTH_URL || 'https://yourstore.com';

  try {
    // Find all pending scheduled posts due now
    const allScheduled = await prisma.storeSetting.findMany({
      where: { key: { startsWith: 'sched_' } },
    });

    const now = new Date();
    const duePosts = allScheduled
      .map(r => {
        try { return { key: r.key, data: JSON.parse(r.value) }; } catch { return null; }
      })
      .filter(r => r && r.data.status === 'PENDING' && new Date(r.data.scheduledAt) <= now) as { key: string; data: any }[];

    if (duePosts.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No posts due' });
    }

    console.log(`[Social Cron] Processing ${duePosts.length} scheduled posts...`);
    const processed: any[] = [];

    for (const item of duePosts) {
      const { key, data } = item;

      try {
        // Mark as RUNNING to prevent double-processing
        await prisma.storeSetting.update({
          where: { key },
          data: { value: JSON.stringify({ ...data, status: 'RUNNING' }) },
        });

        // Fetch product
        const detail = await getProductDetails(data.pid);
        if (!detail.success || !detail.data) throw new Error(`Product ${data.pid} not found`);

        const p = detail.data;
        const baseCj = parseFloat((p.variants?.[0] as any)?.variantSellPrice || (p as any).sellPrice || '0');
        const pricing = calculateMarkupPrice(baseCj);

        // Get or generate AI content
        let aiContent: any = null;
        try {
          const cached = await prisma.storeSetting.findUnique({ where: { key: `ai_content_${data.pid}` } });
          if (cached) {
            const parsed = JSON.parse(cached.value);
            if (Date.now() - new Date(parsed.generatedAt).getTime() < 7 * 24 * 60 * 60 * 1000) {
              aiContent = parsed;
            }
          }
        } catch {}

        if (!aiContent) {
          aiContent = await generateProductContent({
            pid: data.pid,
            name: parseProductName((p as any).productNameEn || p.productName),
            description: p.description,
            categoryName: (p as any).categoryName || '',
            sellPrice: baseCj,
          });
          await prisma.storeSetting.upsert({
            where: { key: `ai_content_${data.pid}` },
            update: { value: JSON.stringify(aiContent) },
            create: { key: `ai_content_${data.pid}`, value: JSON.stringify(aiContent) },
          }).catch(() => {});
        }

        // Build buy link
        const slug = `${data.pid}--${aiContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`;
        const buyLink = `${data.storeBaseUrl || storeBaseUrl}/buy/${slug}`;
        const imageUrl = (p.productImageSet?.[0] || p.productImage || p.bigImage) as string;

        // Post to platforms
        const platforms = data.platforms || ['facebook', 'instagram'];
        const results = await Promise.allSettled(
          platforms.map(async (platform: string) => {
            const getCaption = (): string => {
              if (platform === 'instagram') return aiContent.captions?.instagram || aiContent.captions?.facebook;
              if (platform === 'twitter') return aiContent.captions?.twitter || aiContent.captions?.facebook;
              if (platform === 'whatsapp') return `🔥 ${aiContent.title}\n\nBuy now: ${buyLink}`;
              return aiContent.captions?.facebook || aiContent.title;
            };
            const getHashtags = (): string[] => {
              if (platform === 'instagram') return aiContent.hashtags?.instagram || [];
              if (platform === 'twitter') return aiContent.hashtags?.twitter || [];
              return [];
            };
            const payload: SocialPostPayload = {
              message: getCaption(),
              hashtags: getHashtags(),
              imageUrl: imageUrl || undefined,
              linkUrl: buyLink,
              platforms: [platform as any],
            };
            const res = await postToSocialMedia(payload);
            return res[0];
          })
        );

        const postResults = results.map(r => r.status === 'fulfilled' ? r.value : { platform: 'unknown', success: false });

        // Mark as DONE
        await prisma.storeSetting.update({
          where: { key },
          data: {
            value: JSON.stringify({
              ...data,
              status: 'DONE',
              completedAt: new Date().toISOString(),
              results: postResults,
            }),
          },
        });

        processed.push({ id: key, pid: data.pid, title: aiContent.title, results: postResults });
        console.log(`[Social Cron] ✅ Posted: ${aiContent.title}`);

      } catch (err: any) {
        console.error(`[Social Cron] ❌ Failed ${key}:`, err.message);
        await prisma.storeSetting.update({
          where: { key },
          data: { value: JSON.stringify({ ...item.data, status: 'FAILED', error: err.message }) },
        }).catch(() => {});
        processed.push({ id: key, pid: data.pid, success: false, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processed.length,
      results: processed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Social Cron Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
