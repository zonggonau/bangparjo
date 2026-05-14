export interface CJProduct {
  pid: string;
  productName: string;
  productNameEn: string;
  bigImage: string;
  productImage: string;
  sellPrice: number | string;
  categoryName: string;
  categoryId: string;
  productSku: string;
  productUnit: string;
  productWeight: number;
}

export interface CJVariant {
  vid: string;
  pid?: string;
  variantNameEn?: string;
  variantName?: string;
  variantImage?: string;
  variantSellPrice: number;
  variantSku: string;
  variantKey: string;
  variantWeight?: number; // g
  variantUnit?: string;
  variantLength?: number; // mm
  variantWidth?: number; // mm
  variantHeight?: number; // mm
  variantVolume?: number; // mm3
  inventory?: number;
}

export interface CJProductDetail extends CJProduct {
  description?: string;
  variants: CJVariant[];
  productImageSet?: string[];
  suggestSellPrice?: string;
  listedNum?: number;
  productKey?: string;
  productKeyEn?: string;
}

export interface CJResponse<T> {
  success: boolean;
  result: boolean;
  message: string;
  code: number;
  data: T;
  requestId: string;
}

export function parseProductName(name: string) {
  if (!name) return 'Product';
  return name.replace(/\[.*?\]/g, '').trim();
}

export function parseProductImage(url: string) {
  if (!url) return '/placeholder-product.png';
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
