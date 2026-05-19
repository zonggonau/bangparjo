// ── Central Utility Library ──────────────────────────────────────────────
// Single source of truth for all formatting & parsing functions.
// Import from here instead of duplicating across files.

/**
 * Slugify a string for URL use.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Parse product name — strip CJ prefixes like [CJ], [Hot], etc.
 */
export function parseProductName(name: string): string {
  if (!name) return 'Unknown Product';
  try {
    if (name.startsWith('[') && name.endsWith(']')) {
      const parsed = JSON.parse(name);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(' ');
    }
  } catch { /* not JSON array, use as-is */ }
  return name.replace(/^\[.*?\]\s*/g, '').trim() || name;
}

/**
 * Parse product image URL from various CJ formats.
 */
export function parseProductImage(image: any): string {
  if (!image) return '/placeholder.png';

  // Raw array — take first element
  if (Array.isArray(image) && image.length > 0) {
    return parseProductImage(image[0]);
  }

  if (typeof image !== 'string') {
    try {
      return parseProductImage(String(image));
    } catch { /* fall through */ }
    return '/placeholder.png';
  }

  const trimmed = image.trim();
  if (!trimmed) return '/placeholder.png';

  // JSON array string — parse and take first
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parseProductImage(parsed[0]);
      }
    } catch { /* fall through */ }
    return '/placeholder.png';
  }

  // Already absolute HTTP(S) URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Protocol-relative URL — prepend https:
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Data URI
  if (trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Relative path
  if (trimmed.startsWith('/')) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
    return `${base}${trimmed}`;
  }

  return '/placeholder.png';
}

// ── Currency formatting ──────────────────────────────────────────────────

/**
 * Format a number as USD currency string.
 */
export function formatUSD(price: number | string): string {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(p)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(p);
}

/**
 * Format a number as IDR currency string.
 * Uses the real-time exchange rate from the API when available.
 */
export async function formatIDR(usdPrice: number | string): Promise<string> {
  const price = typeof usdPrice === 'string' ? parseFloat(usdPrice) : usdPrice;
  if (isNaN(price)) return 'Rp 0';

  let rate = 16000; // fallback
  try {
    const { getExchangeRateIDR } = await import('@/lib/currency');
    rate = await getExchangeRateIDR();
  } catch {
    // use fallback
  }

  const idr = price * rate;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(idr);
}

/**
 * Synchronous IDR formatter (uses cached rate, no async).
 */
let _cachedRate = 16000;
export function setCachedRate(rate: number) { _cachedRate = rate; }
export function formatIDRSync(usdPrice: number | string): string {
  const price = typeof usdPrice === 'string' ? parseFloat(usdPrice) : usdPrice;
  if (isNaN(price)) return 'Rp 0';
  const idr = price * _cachedRate;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(idr);
}

// ── Product helpers ──────────────────────────────────────────────────────

/**
 * Strip common prefix from an array of variant names.
 * E.g. ["iPhone 15 Pro Max 256GB", "iPhone 15 Pro Max 512GB"] → ["256GB", "512GB"]
 */
export function stripCommonPrefix(names: string[]): string[] {
  if (names.length === 0) return [];
  if (names.length === 1) return names;
  let prefix = names[0];
  for (const name of names.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < name.length && prefix[i] === name[i]) i++;
    prefix = prefix.slice(0, i);
  }
  const lastSpace = prefix.lastIndexOf(' ');
  const safeLen = lastSpace > 0 ? lastSpace : prefix.length;
  return names.map(n => n.slice(safeLen).trim() || n);
}
