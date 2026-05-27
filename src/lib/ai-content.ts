/**
 * AI Content Generator — Landing Page Content
 *
 * Uses DeepSeek API to analyze a product and generate optimized
 * marketing content for the landing page template.
 * All content generated in ENGLISH for global market audience.
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface AiLandingContent {
  tagline: string;
  heroBadges: string[];
  benefits: Array<{ icon: string; title: string; desc: string }>;
  socialProof: { sold: string; rating: string; reviews: string };
  seoTitle: string;
  seoDescription: string;
  adCopy: string;
  faqs?: Array<{ q: string; a: string }>;
  shippingPolicy?: string;
  returnPolicy?: string;
}



interface ProductInput {
  name: string;
  description: string;
  images: string[];
  variants: Array<{
    color: string | null;
    size: string | null;
    sellingPrice: number;
    inventory: number;
  }>;
}

/**
 * Call DeepSeek API to generate landing page content for a product
 */
export async function generateLandingPageContent(
  product: ProductInput
): Promise<AiLandingContent> {
  const minPrice = Math.min(...product.variants.map(v => v.sellingPrice));
  const maxPrice = Math.max(...product.variants.map(v => v.sellingPrice));
  const priceRange = minPrice === maxPrice
    ? `$${minPrice.toFixed(2)}`
    : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  const totalStock = product.variants.reduce((sum, v) => sum + v.inventory, 0);
  const variantCount = product.variants.length;

  const systemPrompt = `You are a professional e-commerce copywriter for global dropshipping. CRITICAL: You MUST generate ALL text in ENGLISH only. NEVER use any other language. Generate ONLY pure JSON, no markdown, no backticks, no explanations. Focus on benefits, emotional appeal, and conversion optimization.`;

  const userPrompt = `Analyze this product and generate optimized marketing content for a social media landing page (Facebook/Instagram/TikTok/Google Ads). Write in ENGLISH for a global audience.

PRODUCT DATA:
- Name: ${product.name}
- Description: ${product.description?.substring(0, 500) || 'No description available'}
- Price Range: ${priceRange}
- Variants: ${variantCount}
- Total Stock: ${totalStock}

INSTRUCTIONS — Focus on BENEFITS over features. Use simple, emotional language. Add urgency where appropriate.

Generate JSON with this exact structure:
{
  "tagline": "Short powerful headline (max 8 words) for hero section, conversion-focused",
  "heroBadges": ["3 short badges (max 2 words each), e.g.: Best Seller, Hot Deal, Limited Stock, Trending"],
  "benefits": [
    {"icon": "quality", "title": "benefit title 1 (2-3 words)", "desc": "short benefit description 8-12 words, focus on what customer gains"},
    {"icon": "price", "title": "benefit title 2", "desc": "short description"},
    {"icon": "shipping", "title": "benefit title 3", "desc": "short description"}
  ],
  "socialProof": {
    "sold": "realistic units sold estimate (e.g., 2,500+)",
    "rating": "star rating (4.5 - 5.0)",
    "reviews": "review count (e.g., 850+)"
  },
  "seoTitle": "SEO title max 60 characters for meta tag",
  "seoDescription": "SEO description max 160 characters for meta tag",
  "adCopy": "Social media ad copy 1-2 short compelling sentences, max 150 chars",
  "faqs": [
    {"q": "FAQ question 1 related to this product", "a": "Clear short answer max 20 words"},
    {"q": "FAQ question 2", "a": "Answer 2"},
    {"q": "FAQ question 3 (shipping, sizing, or usage)", "a": "Answer 3"}
  ],
  "shippingPolicy": "Shipping policy 1-2 sentences. Estimated delivery time and carrier.",
  "returnPolicy": "Return/warranty policy 1-2 sentences. Terms and conditions."
}

ALL TEXT MUST BE IN ENGLISH.
Pure JSON only, no markdown, no backticks.`;


  // Try DeepSeek
  if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'sk-your-deepseek-api-key-here') {
    try {
      const result = await callDeepSeek(systemPrompt, userPrompt, product.name);
      if (result) return result;
    } catch (err) {
      console.warn('[AI Content] DeepSeek failed:', err);
    }
  }

  return getFallbackContent(product.name);
}


/**
 * Call DeepSeek chat completions API
 */
async function callDeepSeek(systemPrompt: string, userPrompt: string, productName: string): Promise<AiLandingContent | null> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[AI Content] DeepSeek API error:', response.status, errText);
    return null;
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';

  return parseAiResponse(text, productName);
}

/**
 * Parse AI response JSON into AiLandingContent
 */
function parseAiResponse(text: string, productName: string): AiLandingContent | null {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const fallback = getFallbackContent(productName);
    return {
      tagline: parsed.tagline || fallback.tagline,
      heroBadges: Array.isArray(parsed.heroBadges) ? parsed.heroBadges.slice(0, 3) : fallback.heroBadges,
      benefits: Array.isArray(parsed.benefits) ? parsed.benefits.slice(0, 3) : fallback.benefits,
      socialProof: parsed.socialProof || fallback.socialProof,
      seoTitle: parsed.seoTitle || fallback.seoTitle,
      seoDescription: parsed.seoDescription || fallback.seoDescription,
      adCopy: parsed.adCopy || fallback.adCopy,
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs.slice(0, 5) : undefined,
      shippingPolicy: parsed.shippingPolicy || undefined,
      returnPolicy: parsed.returnPolicy || undefined,
    };
  } catch {
    console.error('[AI Content] Failed to parse AI response as JSON:', text.substring(0, 200));
    return null;
  }
}



/**
 * Backward-compatible exports for social-post routes
 * These were previously defined in this file and are still imported by
 * src/app/api/cron/social-post/route.ts and src/app/api/social/post/route.ts
 */
export async function generateProductContent(product: any): Promise<string> {
  return product?.name || 'Product';
}

export function calculateMarkupPrice(baseCost: number, markupPercent?: number): { sellingPrice: number; discount: number } {
  const percent = markupPercent || 30;
  const sellingPrice = baseCost * (1 + percent / 100);
  return { sellingPrice, discount: 0 };
}

/**
 * Fallback content when AI is unavailable
 */
function getFallbackContent(productName: string): AiLandingContent {
  return {
    tagline: `${productName} — Best Price, Global Shipping`,
    heroBadges: ['Best Seller', 'Global Shipping', 'Best Price'],
    benefits: [
      { icon: 'quality', title: 'Premium Quality', desc: 'High-quality products meeting international standards. Satisfaction guaranteed.' },
      { icon: 'price', title: 'Best Price Guarantee', desc: 'Get the best prices directly from suppliers. No middleman markup.' },
      { icon: 'shipping', title: 'Fast Worldwide Shipping', desc: 'Global delivery with real-time tracking.' },
    ],
    socialProof: { sold: '2,500+', rating: '4.8', reviews: '850+' },
    seoTitle: `${productName} — Shop Global at BangParjo`,
    seoDescription: `Buy ${productName} at the best price. Premium quality, fast worldwide shipping, and money-back guarantee. Shop now at BangParjo.`,
    adCopy: `${productName} at unbeatable prices! ✓ Premium quality ✓ Fast global shipping ✓ 30-day returns. Order now!`,
  };
}
