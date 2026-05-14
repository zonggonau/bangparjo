/**
 * AI Content Generator — Powered by Google Gemini
 * Generates product titles, captions, hashtags, pricing, and video scripts
 * for global English-language dropshipping marketing.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface ProductInput {
  pid: string;
  name: string;           // Raw CJ product name (may be messy)
  description?: string;
  categoryName?: string;
  sellPrice: number;      // USD base cost from CJ
  shippingCost?: number;  // USD shipping estimate
  images?: string[];
}

export interface GeneratedContent {
  // Rewritten Product Info
  title: string;            // Clean, SEO-friendly title
  shortTitle: string;       // ≤60 chars for ads
  sellingPrice: number;     // Calculated markup price (USD)
  originalPrice: number;    // Fake "original" higher price for urgency
  discount: string;         // e.g. "47% OFF"

  // Social Media
  captions: {
    facebook: string;
    instagram: string;
    twitter: string;
    tiktok: string;
  };

  // Hashtags per platform (already include #)
  hashtags: {
    instagram: string[];   // 20-30 tags
    tiktok: string[];      // 5-10 tags
    twitter: string[];     // 3-5 tags
  };

  // Ad Copy
  headlines: string[];     // 3 A/B test headlines
  cta: string;             // e.g. "Shop Now — Free Shipping Today!"
  
  // Video
  videoScript: string;     // UGC-style short video hook + script

  // SEO
  metaTitle: string;
  metaDescription: string;

  // Product Scoring
  viralScore: number;      // 1-10
  viralReason: string;

  // Timestamp
  generatedAt: string;
}

/**
 * Auto-pricing rule:
 * - base < $5   → 3.0x markup (budget impulse)
 * - base < $15  → 2.5x markup
 * - base < $30  → 2.2x markup
 * - base < $60  → 2.0x markup
 * - base < $100 → 1.8x markup
 * - base >= $100 → 1.5x markup
 * Minimum margin: $3 profit
 */
export function calculateMarkupPrice(baseCostUSD: number, shippingUSD: number = 0): {
  sellingPrice: number;
  originalPrice: number;
  discount: string;
  profitMargin: number;
} {
  const totalCost = baseCostUSD + shippingUSD;

  let multiplier: number;
  if (baseCostUSD < 5) multiplier = 3.0;
  else if (baseCostUSD < 15) multiplier = 2.5;
  else if (baseCostUSD < 30) multiplier = 2.2;
  else if (baseCostUSD < 60) multiplier = 2.0;
  else if (baseCostUSD < 100) multiplier = 1.8;
  else multiplier = 1.5;

  let sellingPrice = Math.ceil((totalCost * multiplier) / 0.5) * 0.5; // Round to nearest $0.50
  const minSelling = totalCost + 3; // Minimum $3 profit
  if (sellingPrice < minSelling) sellingPrice = Math.ceil(minSelling / 0.5) * 0.5;

  // "Original" price = 40-60% higher than selling for urgency
  const originalMultiplier = 1.45 + Math.random() * 0.15;
  const originalPrice = Math.ceil((sellingPrice * originalMultiplier) / 0.5) * 0.5;

  const discountPct = Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
  const profitMargin = sellingPrice - totalCost;

  return {
    sellingPrice,
    originalPrice,
    discount: `${discountPct}% OFF`,
    profitMargin,
  };
}

/**
 * Build the Gemini prompt for content generation
 */
function buildPrompt(product: ProductInput, pricing: ReturnType<typeof calculateMarkupPrice>): string {
  return `You are an expert e-commerce copywriter and social media marketer for a GLOBAL dropshipping store selling in English.

## Product Info
- Raw Name: ${product.name}
- Category: ${product.categoryName || 'General'}
- Base Cost: $${product.sellPrice.toFixed(2)} USD
- Our Selling Price: $${pricing.sellingPrice.toFixed(2)} USD
- "Original" Price (for discount urgency): $${pricing.originalPrice.toFixed(2)} USD
- Discount Badge: ${pricing.discount}
- Description snippet: ${(product.description || '').slice(0, 300)}

## Task
Generate ALL of the following in valid JSON format (no markdown, only raw JSON):

{
  "title": "Clean SEO-friendly product title in English, max 80 chars, no ALL CAPS, no brand names",
  "shortTitle": "Ad-ready title max 60 chars",
  "captions": {
    "facebook": "Engaging Facebook post caption (150-200 words). Start with a hook. Include price, discount, urgency. End with CTA. Use line breaks. NO hashtags here.",
    "instagram": "Instagram caption (100-150 words). Conversational, lifestyle-focused. Start with emoji hook. End with CTA. NO hashtags (they go separate).",
    "twitter": "Twitter/X post. Max 250 chars. Punchy. Include price & link placeholder [link].",
    "tiktok": "TikTok caption. Max 150 chars. Trendy, relatable, use emojis. CTA at end."
  },
  "hashtags": {
    "instagram": ["array", "of", "20", "relevant", "hashtags", "WITH", "hash", "symbol"],
    "tiktok": ["array", "of", "8", "trending", "hashtags"],
    "twitter": ["array", "of", "4", "hashtags"]
  },
  "headlines": [
    "Headline A — benefit-focused",
    "Headline B — urgency/scarcity",
    "Headline C — curiosity/problem-solution"
  ],
  "cta": "Single most compelling call-to-action line (max 10 words)",
  "videoScript": "30-second UGC-style video script. Format: [HOOK - 3 sec] / [PROBLEM - 5 sec] / [SOLUTION - 10 sec] / [PRODUCT DEMO - 8 sec] / [CTA - 4 sec]. Keep each section on new line.",
  "metaTitle": "SEO meta title max 60 chars",
  "metaDescription": "SEO meta description max 155 chars, include price and benefit",
  "viralScore": 7,
  "viralReason": "One sentence explaining why this product has viral/winning potential"
}

IMPORTANT: Return ONLY the JSON object. No explanation, no markdown fences.`;
}

/**
 * Call Gemini API and parse response
 */
async function callGemini(prompt: string): Promise<any> {
  const res = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Strip markdown fences if model wrapped it anyway
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object from text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Gemini returned non-JSON response');
  }
}

/**
 * Main function: Generate complete marketing content for a product
 */
export async function generateProductContent(product: ProductInput): Promise<GeneratedContent> {
  const pricing = calculateMarkupPrice(product.sellPrice, product.shippingCost || 0);
  const prompt = buildPrompt(product, pricing);
  const aiResponse = await callGemini(prompt);

  return {
    title: aiResponse.title || product.name,
    shortTitle: aiResponse.shortTitle || product.name.slice(0, 60),
    sellingPrice: pricing.sellingPrice,
    originalPrice: pricing.originalPrice,
    discount: pricing.discount,
    captions: {
      facebook: aiResponse.captions?.facebook || '',
      instagram: aiResponse.captions?.instagram || '',
      twitter: aiResponse.captions?.twitter || '',
      tiktok: aiResponse.captions?.tiktok || '',
    },
    hashtags: {
      instagram: aiResponse.hashtags?.instagram || [],
      tiktok: aiResponse.hashtags?.tiktok || [],
      twitter: aiResponse.hashtags?.twitter || [],
    },
    headlines: aiResponse.headlines || [],
    cta: aiResponse.cta || 'Shop Now — Limited Stock!',
    videoScript: aiResponse.videoScript || '',
    metaTitle: aiResponse.metaTitle || '',
    metaDescription: aiResponse.metaDescription || '',
    viralScore: typeof aiResponse.viralScore === 'number' ? aiResponse.viralScore : 5,
    viralReason: aiResponse.viralReason || '',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Score a product's viral/winning potential (quick pass, no full generation)
 */
export async function scoreProduct(product: ProductInput): Promise<{
  score: number;
  reason: string;
  recommendation: 'promote' | 'test' | 'skip';
}> {
  const prompt = `You are a dropshipping product analyst. Score this product's viral/winning potential for global social media ads.

Product: ${product.name}
Category: ${product.categoryName || 'Unknown'}
Price (CJ cost): $${product.sellPrice} USD

Respond ONLY with JSON:
{
  "score": <1-10 integer>,
  "reason": "<one sentence>",
  "recommendation": "<promote|test|skip>"
}`;

  try {
    const result = await callGemini(prompt);
    return {
      score: result.score || 5,
      reason: result.reason || 'No analysis available',
      recommendation: result.recommendation || 'test',
    };
  } catch {
    return { score: 5, reason: 'Analysis failed', recommendation: 'test' };
  }
}
