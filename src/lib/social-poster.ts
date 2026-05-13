/**
 * Social Media Auto-Poster Library
 * Supports: Facebook Page, Instagram Business, X (Twitter), WhatsApp Cloud API
 *
 * Env vars needed (add to .env.local):
 * META_PAGE_ACCESS_TOKEN=...
 * META_PAGE_ID=...
 * META_IG_BUSINESS_ACCOUNT_ID=...
 * X_BEARER_TOKEN=...
 * X_API_KEY=...
 * X_API_SECRET=...
 * X_ACCESS_TOKEN=...
 * X_ACCESS_TOKEN_SECRET=...
 * WHATSAPP_PHONE_NUMBER_ID=...
 * WHATSAPP_ACCESS_TOKEN=...
 * WHATSAPP_RECIPIENT_NUMBERS=+1234567890,+0987654321  (comma-separated)
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface SocialPostPayload {
  message: string;        // Main caption/text
  hashtags?: string[];    // Will be appended to message
  imageUrl?: string;      // Public image URL (must be accessible)
  linkUrl?: string;       // CTA link e.g. https://store.com/buy/product-slug
  platforms: Array<'facebook' | 'instagram' | 'twitter' | 'whatsapp'>;
}

export interface PostResult {
  platform: string;
  success: boolean;
  postId?: string;
  error?: string;
  url?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildFullCaption(message: string, hashtags?: string[], linkUrl?: string): string {
  let text = message;
  if (linkUrl) text += `\n\n🛒 Shop Here: ${linkUrl}`;
  if (hashtags?.length) text += `\n\n${hashtags.join(' ')}`;
  return text;
}

// ── Facebook Page ──────────────────────────────────────────────────────────

async function postToFacebook(payload: SocialPostPayload): Promise<PostResult> {
  const PAGE_ID = process.env.META_PAGE_ID;
  const TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

  if (!PAGE_ID || !TOKEN) {
    return { platform: 'facebook', success: false, error: 'META_PAGE_ID or META_PAGE_ACCESS_TOKEN not configured' };
  }

  const message = buildFullCaption(payload.message, payload.hashtags, payload.linkUrl);

  try {
    let endpoint: string;
    let body: Record<string, any>;

    if (payload.imageUrl) {
      // Photo post
      endpoint = `https://graph.facebook.com/v19.0/${PAGE_ID}/photos`;
      body = { url: payload.imageUrl, caption: message, access_token: TOKEN };
    } else {
      // Link / text post
      endpoint = `https://graph.facebook.com/v19.0/${PAGE_ID}/feed`;
      body = { message, access_token: TOKEN };
      if (payload.linkUrl) body.link = payload.linkUrl;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const postId = data.post_id || data.id;
    return {
      platform: 'facebook',
      success: true,
      postId,
      url: `https://www.facebook.com/${postId}`,
    };
  } catch (err: any) {
    return { platform: 'facebook', success: false, error: err.message };
  }
}

// ── Instagram Business ─────────────────────────────────────────────────────
// Requires: image URL accessible by Meta servers, IG Business Account linked to Page

async function postToInstagram(payload: SocialPostPayload): Promise<PostResult> {
  const IG_ID = process.env.META_IG_BUSINESS_ACCOUNT_ID;
  const TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

  if (!IG_ID || !TOKEN) {
    return { platform: 'instagram', success: false, error: 'META_IG_BUSINESS_ACCOUNT_ID or META_PAGE_ACCESS_TOKEN not configured' };
  }

  if (!payload.imageUrl) {
    return { platform: 'instagram', success: false, error: 'Instagram requires an imageUrl' };
  }

  const caption = buildFullCaption(payload.message, payload.hashtags, payload.linkUrl);

  try {
    // Step 1: Create media container
    const containerRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: payload.imageUrl,
        caption,
        access_token: TOKEN,
      }),
    });
    const container = await containerRes.json();
    if (container.error) throw new Error(container.error.message);

    // Step 2: Publish
    const publishRes = await fetch(`https://graph.facebook.com/v19.0/${IG_ID}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: container.id, access_token: TOKEN }),
    });
    const published = await publishRes.json();
    if (published.error) throw new Error(published.error.message);

    return {
      platform: 'instagram',
      success: true,
      postId: published.id,
      url: `https://www.instagram.com/p/${published.id}`,
    };
  } catch (err: any) {
    return { platform: 'instagram', success: false, error: err.message };
  }
}

// ── X (Twitter) ────────────────────────────────────────────────────────────
// Uses OAuth 1.0a — requires all 4 tokens

async function postToTwitter(payload: SocialPostPayload): Promise<PostResult> {
  const API_KEY = process.env.X_API_KEY;
  const API_SECRET = process.env.X_API_SECRET;
  const ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
  const ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

  if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_TOKEN_SECRET) {
    return { platform: 'twitter', success: false, error: 'X API credentials not fully configured' };
  }

  // Build tweet text (max 280 chars)
  let text = payload.message;
  if (payload.linkUrl) text += ` ${payload.linkUrl}`;
  if (payload.hashtags?.length) {
    const tags = payload.hashtags.slice(0, 4).join(' ');
    text += ` ${tags}`;
  }
  text = text.slice(0, 280);

  try {
    // OAuth 1.0a signature generation
    const oauthHeader = await generateOAuth1Header('POST', 'https://api.twitter.com/2/tweets', API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET);

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: oauthHeader,
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0]?.message || 'X API error');

    return {
      platform: 'twitter',
      success: true,
      postId: data.data?.id,
      url: `https://x.com/i/web/status/${data.data?.id}`,
    };
  } catch (err: any) {
    return { platform: 'twitter', success: false, error: err.message };
  }
}

// OAuth 1.0a signature generator (for X/Twitter)
async function generateOAuth1Header(method: string, url: string, apiKey: string, apiSecret: string, accessToken: string, tokenSecret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  // Create signature base string
  const paramString = Object.keys(oauthParams).sort().map(k => `${encode(k)}=${encode(oauthParams[k])}`).join('&');
  const baseString = `${method}&${encode(url)}&${encode(paramString)}`;
  const signingKey = `${encode(apiSecret)}&${encode(tokenSecret)}`;

  // HMAC-SHA1
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(signingKey), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(baseString));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));

  oauthParams['oauth_signature'] = signature;

  return 'OAuth ' + Object.entries(oauthParams).map(([k, v]) => `${encode(k)}="${encode(v)}"`).join(', ');
}

function encode(s: string): string {
  return encodeURIComponent(s).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

// ── WhatsApp Cloud API ─────────────────────────────────────────────────────

async function postToWhatsApp(payload: SocialPostPayload): Promise<PostResult> {
  const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const RECIPIENTS = (process.env.WHATSAPP_RECIPIENT_NUMBERS || '').split(',').map(s => s.trim()).filter(Boolean);

  if (!PHONE_ID || !TOKEN) {
    return { platform: 'whatsapp', success: false, error: 'WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not configured' };
  }

  if (RECIPIENTS.length === 0) {
    return { platform: 'whatsapp', success: false, error: 'WHATSAPP_RECIPIENT_NUMBERS not configured' };
  }

  const text = buildFullCaption(payload.message, payload.hashtags?.slice(0, 5), payload.linkUrl);

  try {
    const results = await Promise.allSettled(
      RECIPIENTS.map(to =>
        fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text },
          }),
        }).then(r => r.json())
      )
    );

    const allOk = results.every(r => r.status === 'fulfilled' && !(r.value as any).error);
    return {
      platform: 'whatsapp',
      success: allOk,
      postId: `wa-broadcast-${Date.now()}`,
    };
  } catch (err: any) {
    return { platform: 'whatsapp', success: false, error: err.message };
  }
}

// ── Main Dispatcher ────────────────────────────────────────────────────────

export async function postToSocialMedia(payload: SocialPostPayload): Promise<PostResult[]> {
  const tasks: Promise<PostResult>[] = [];

  if (payload.platforms.includes('facebook')) tasks.push(postToFacebook(payload));
  if (payload.platforms.includes('instagram')) tasks.push(postToInstagram(payload));
  if (payload.platforms.includes('twitter')) tasks.push(postToTwitter(payload));
  if (payload.platforms.includes('whatsapp')) tasks.push(postToWhatsApp(payload));

  const results = await Promise.allSettled(tasks);
  return results.map(r => {
    if (r.status === 'fulfilled') return r.value;
    return { platform: 'unknown', success: false, error: r.reason?.message || 'Unknown error' };
  });
}

// ── WhatsApp Order Notifications ──────────────────────────────────────────

export async function sendWhatsAppOrderNotification(params: {
  to: string;         // Customer WhatsApp number e.g. +15551234567
  customerName: string;
  orderId: string;
  totalAmount: number;
  trackingNumber?: string;
  type: 'order_placed' | 'order_shipped' | 'promo';
  promoMessage?: string;
  productName?: string;
  productLink?: string;
}): Promise<boolean> {
  const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!PHONE_ID || !TOKEN) return false;

  let body: string;

  switch (params.type) {
    case 'order_placed':
      body = `Hi ${params.customerName}! 🎉\n\nYour order *#${params.orderId}* has been placed successfully!\n\n💰 Total: $${params.totalAmount.toFixed(2)}\n📦 We'll notify you when it ships.\n\nThank you for shopping with us! 🛒`;
      break;
    case 'order_shipped':
      body = `Hi ${params.customerName}! 🚀\n\nGreat news — your order *#${params.orderId}* is on its way!\n\n📬 Tracking: *${params.trackingNumber || 'Processing...'}*\n\nEstimated delivery: 7-20 business days.\nTrack here: https://www.17track.net\n\nThank you! ❤️`;
      break;
    case 'promo':
      body = params.promoMessage || `🔥 *Flash Sale Alert!*\n\n${params.productName}\nLimited time offer — tap the link to grab yours:\n${params.productLink}`;
      break;
    default:
      body = params.promoMessage || 'Hello from our store!';
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'text',
        text: { body },
      }),
    });
    const data = await res.json();
    return !data.error;
  } catch {
    return false;
  }
}
