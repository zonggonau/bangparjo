export interface CJShippingMethod {
  logisticName: string;
  logisticPrice: number;
  logisticAging: string;
  logisticId: string;
  formattedPrice?: string;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

export function parseProductName(name: string): string {
  if (!name) return '';
  // Remove common prefix like [CJ] or something
  return name.replace(/^\[.*?\]\s*/, '').trim();
}

export function parseProductImage(image: any): string {
  if (!image) return '/placeholder.png';
  if (typeof image === 'string') {
    if (image.startsWith('http')) return image;
    if (image.startsWith('//')) return 'https:' + image;
    // Handle relative paths if any
    return image;
  }
  return '/placeholder.png';
}

const USD_TO_IDR = 16000;

export function formatIDR(usdPrice: number | string): string {
  const price = typeof usdPrice === 'string' ? parseFloat(usdPrice) : usdPrice;
  if (isNaN(price)) return 'Rp 0';
  const idr = price * USD_TO_IDR;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(idr);
}

export function formatUSD(price: number | string) {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(p) ? '$0.00' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
}
