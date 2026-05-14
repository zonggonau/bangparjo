// ── Throttle (Server-side Only) ──────────────────────────────────────────
let lastRequestAt = 0;
const MIN_INTERVAL_MS = 5000; // Increased to 5s to reduce QPS limit hits

async function waitForSlot(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - now);
  lastRequestAt = now + wait;
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait));
  }
}

// ── Simple Cache (In-Memory) ────────────────────────────────────────────────
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes for products/lists
const apiCache = new Map<string, { data: any, expiry: number }>();

function getCache(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() < cached.expiry) return cached.data;
  apiCache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  apiCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
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


// ── Currency helpers ───────────────────────────────────────────────────────
const USD_TO_IDR = 16000; 

export function formatIDR(usdPrice: number | string): string {
  const price = typeof usdPrice === 'string' ? parseFloat(usdPrice) : usdPrice;
  if (isNaN(price)) return 'Rp 0';
  const idr = price * USD_TO_IDR;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(idr);
}

// ── String helpers ─────────────────────────────────────────────────────────
export function parseProductName(name: string): string {
  if (!name) return 'Unknown Product';
  try {
    if (name.startsWith('[') && name.endsWith(']')) {
      const parsed = JSON.parse(name);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join(' ');
    }
  } catch { /* not JSON array, use as-is */ }
  return name;
}

export function parseProductImage(image: any): string {
  if (!image) return '/placeholder.png';

  // Raw array — take first element
  if (Array.isArray(image) && image.length > 0) {
    return parseProductImage(image[0]);
  }

  if (typeof image !== 'string') {
    // Try converting to string (rare CJ edge case)
    try {
      const s = String(image);
      return parseProductImage(s);
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

  // Relative path — unlikely from CJ but handle gracefully
  if (trimmed.startsWith('/')) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://bangparjo.shop';
    return `${base}${trimmed}`;
  }

  return '/placeholder.png';
}

// ── Config ────────────────────────────────────────────────────────────────
export const BASE_URL = process.env.CJ_API_BASE_URL || 'https://api.cjdropshipping.com';
const API_KEY = process.env.CJ_API_KEY;

// ── Token cache ───────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export interface CJResponse<T> {
  success: boolean;
  result: boolean;
  message: string;
  code: number;
  data: T;
  requestId: string;
}

export async function getAccessTokenServer(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) return cachedToken;

  try {
    const { prisma } = await import('@/lib/db');
    const dbToken = await prisma.storeSetting.findUnique({ where: { key: 'CJ_ACCESS_TOKEN' } });
    const dbExpiry = await prisma.storeSetting.findUnique({ where: { key: 'CJ_TOKEN_EXPIRY' } });
    
    if (dbToken && dbExpiry && Date.now() < parseInt(dbExpiry.value)) {
      cachedToken = dbToken.value;
      tokenExpiry = parseInt(dbExpiry.value);
      return cachedToken;
    }
  } catch (e) {
    console.error('[Token DB Load Error]:', e);
  }

  await waitForSlot();
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) return cachedToken;

  const url = `${BASE_URL}/v1/authentication/getAccessToken`;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: API_KEY }),
      });
      const data: CJResponse<{ accessToken: string }> = await response.json();
      
      if (!data.success && !data.result) {
        if (data.message?.includes('QPS limit') || data.code === 1600100) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          continue;
        }
        throw new Error(data.message || 'Auth failed');
      }

      cachedToken = data.data.accessToken;
      tokenExpiry = Date.now() + 14 * 24 * 60 * 60 * 1000;

      try {
        const { prisma } = await import('@/lib/db');
        await prisma.storeSetting.upsert({
          where: { key: 'CJ_ACCESS_TOKEN' },
          update: { value: cachedToken },
          create: { key: 'CJ_ACCESS_TOKEN', value: cachedToken }
        });
        await prisma.storeSetting.upsert({
          where: { key: 'CJ_TOKEN_EXPIRY' },
          update: { value: tokenExpiry.toString() },
          create: { key: 'CJ_TOKEN_EXPIRY', value: tokenExpiry.toString() }
        });
      } catch (e) {
        console.error('[Token DB Save Error]:', e);
      }
      return cachedToken!;
    } catch (err: any) {
      if (retryCount >= maxRetries) throw err;
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  throw new Error('Failed to get CJ access token after retries');
}

// ── Generic fetcher ───────────────────────────────────────────────────────
export async function cjFetch<T>(
  endpoint: string,
  options: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {}
): Promise<CJResponse<T>> {
  if (typeof window !== 'undefined') {
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    if (isGet) {
      const url = `/api/cj-proxy?endpoint=${encodeURIComponent(endpoint)}`;
      const response = await fetch(url);
      return response.json();
    }
    const response = await fetch('/api/cj-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        method: options.method,
        data: options.body ? JSON.parse(options.body as string) : undefined,
        headers: options.headers,
      }),
    });
    return response.json();
  }

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = `cj_${endpoint}_${JSON.stringify(options.body || '')}`;
  if (isGet) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  let retryCount = 0;
  const maxRetries = 5; // Increased to 5 retries

  while (retryCount < maxRetries) {
    try {
      const token = await getAccessTokenServer();
      await waitForSlot();

      const fetchOptions: any = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': token,
          ...(options.headers as Record<string, string>),
        },
      };

      if (isGet && !fetchOptions.next && !fetchOptions.cache) {
        fetchOptions.next = { revalidate: 3600 };
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, fetchOptions);
      const data = await response.json();

      // Handle Invalid/Expired Token (Retry once with fresh token)
      if (!data.success && !data.result && (data.code === 1600101 || data.code === 1600102 || data.message?.toLowerCase().includes('access token'))) {
        if (retryCount === 0) {
          console.warn(`[CJ API] Token invalid or expired. Clearing cache and retrying...`);
          cachedToken = null;
          tokenExpiry = null;
          try {
            const { prisma } = await import('@/lib/db');
            await prisma.storeSetting.deleteMany({
              where: { key: { in: ['CJ_ACCESS_TOKEN', 'CJ_TOKEN_EXPIRY'] } }
            });
          } catch (e) {
            console.error('[Token Clear Error]:', e);
          }
          retryCount++;
          continue;
        }
      }

      // Handle QPS Limit
      if (!data.success && !data.result && (data.code === 1600100 || data.message?.includes('QPS limit'))) {
        retryCount++;
        // Exponential backoff with jitter: 2s, 4s, 8s, 16s...
        const baseWait = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        const wait = baseWait + jitter;
        
        console.warn(`[CJ API] QPS Limit on ${endpoint}. Retrying in ${Math.round(wait)}ms (Attempt ${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }

      if (isGet && (data.success || data.result)) {
        setCache(cacheKey, data);
      }
      return data;
    } catch (err: any) {
      if (retryCount >= maxRetries) throw err;
      retryCount++;
      const wait = 2000 * retryCount;
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }
  throw new Error(`Failed to fetch from CJ after ${maxRetries} retries due to QPS limits or network errors`);
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface CJProduct {
  pid: string;
  productName: string;
  productNameEn: string;
  productSku?: string;
  productImage: string;
  bigImage?: string;
  sellPrice: number;
  categoryId?: string;
  categoryName: string;
  isFreeShipping?: boolean;
  listedNum?: number;
  productWeight?: number; // g
  productUnit?: string;
  productType?: string;
  isActive?: boolean;
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

// ── Products ──────────────────────────────────────────────────────────────
export async function getProducts(
  params: {
    pageNum?: number;
    pageSize?: number;
    keyWord?: string;
    categoryId?: string;
    countryCode?: string;
    minPrice?: number;
    maxPrice?: number;
    searchType?: number; // 0=all, 2=trending
    productSku?: string;
  } = {}
): Promise<CJResponse<{ list: CJProduct[]; total: number }>> {
  const query = new URLSearchParams({
    pageNum: (params.pageNum || 1).toString(),
    pageSize: (params.pageSize || 20).toString(),
  });
  if (params.keyWord) query.set('productNameEn', params.keyWord);
  if (params.productSku) query.set('productSku', params.productSku);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.countryCode) query.set('countryCode', params.countryCode);
  if (params.minPrice != null) query.set('minPrice', params.minPrice.toString());
  if (params.maxPrice != null) query.set('maxPrice', params.maxPrice.toString());
  if (params.searchType != null) query.set('searchType', params.searchType.toString());

  return cjFetch(`/v1/product/list?${query.toString()}`);
}

export async function getProductDetails(id: string): Promise<CJResponse<CJProductDetail>> {
  const res = await cjFetch<CJProductDetail>(`/v1/product/query?pid=${id}`);
  if (!res.success && id.length > 5) {
    const resSku = await cjFetch<CJProductDetail>(`/v1/product/query?productSku=${id}`);
    if (resSku.success) return resSku;
  }
  return res;
}

// ── Shipping ──────────────────────────────────────────────────────────────
export interface CJShippingMethod {
  logisticName: string;
  logisticPrice: number;
  logisticPriceCn?: number;
  logisticAging: string;
  taxesFee?: number;
  totalPostageFee?: number;
}

/**
 * Get shipping fees using SKU (more reliable than VID)
 * Uses CJ's freightCalculateTip API which accepts SKU lookup
 */
export async function getShippingFeeBySku(params: {
  products: Array<{ sku: string; quantity: number; weight?: number; price?: number }>;
  endCountryCode: string;
  startCountryCode?: string;
}): Promise<CJResponse<CJShippingMethod[]>> {
  const cacheKey = `shipping_sku_${JSON.stringify(params.products)}_${params.endCountryCode}`;
  const cached = getCache(cacheKey);
  if (cached) return { success: true, result: true, data: cached, code: 200, message: 'Cached', requestId: 'cached' };

  const reqDTOS = [{
    srcAreaCode: params.startCountryCode || 'CN',
    destAreaCode: params.endCountryCode,
    weight: params.products.reduce((sum, p) => sum + (p.weight || 200) * p.quantity, 0),
    volume: 0.001,
    totalGoodsAmount: params.products.reduce((sum, p) => sum + (p.price || 10) * p.quantity, 0),
    productProp: ['COMMON'],
    freightTrialSkuList: params.products.map(p => ({
      sku: p.sku,
      skuQuantity: p.quantity,
      skuWeight: p.weight || 200,
    })),
    skuList: params.products.map(p => p.sku),
    platforms: ['API'],
  }];

  try {
    const res = await cjFetch<any>('/v1/logistic/freightCalculateTip', {
      method: 'POST',
      body: JSON.stringify({ reqDTOS }),
    });

    if (res.success && res.data && res.data.length > 0) {
      // Map the detailed response back to simple CJShippingMethod format
      const methods: CJShippingMethod[] = res.data.map((item: any) => ({
        logisticName: item.option?.enName || item.channel?.enName || 'Unknown',
        logisticPrice: item.postage || item.discountFee || 0,
        logisticPriceCn: item.postageCNY || item.discountFeeCNY || 0,
        logisticAging: item.arrivalTime || 'Unknown',
        taxesFee: item.taxesFee,
        totalPostageFee: item.postage || item.discountFee || 0,
      }));
      apiCache.set(cacheKey, { data: methods, expiry: Date.now() + (1000 * 60 * 10) });
      return { success: true, result: true, data: methods, code: 200, message: 'Success', requestId: 'sku' };
    }
    
    // Fallback jika gagal
    if (!res.success) {
      console.warn(`[Shipping SKU API] Failed: ${res.message}.`);
    }
    return res;
  } catch (err) {
    console.warn('[Shipping SKU API] Error:', err);
    return { success: false, result: false, message: 'Error', data: null as any, code: 500, requestId: '' };
  }
}

export async function getShippingFee(params: {
  products: Array<{ vid: string; quantity: number }>;
  endCountryCode: string;
  startCountryCode?: string;
}): Promise<CJResponse<CJShippingMethod[]>> {
  // ── Cache Hack ──────────────────────────────────────────────────────────
  // Shipping rates don't change that often. Cache for 10 minutes.
  const cacheKey = `shipping_${JSON.stringify(params.products)}_${params.endCountryCode}`;
  const cached = getCache(cacheKey);
  if (cached) return { success: true, result: true, data: cached, code: 200, message: 'Cached', requestId: 'cached' };

  try {
    const res = await cjFetch<CJShippingMethod[]>('/v1/logistic/freightCalculate', {
      method: 'POST',
      body: JSON.stringify({
        startCountryCode: params.startCountryCode || 'CN',
        endCountryCode: params.endCountryCode,
        products: params.products,
      }),
    });

    if (res.success && res.data) {
      // Cache for 10 mins (shorter than products)
      apiCache.set(cacheKey, { data: res.data, expiry: Date.now() + (1000 * 60 * 10) });
    }
    
    // Fallback logic if API fails due to QPS or other issues
    if (!res.success) {
       console.warn(`[Shipping API] Failed for ${cacheKey}: ${res.message}. Returning fallback.`);
       // Minimal fallback to avoid blocking checkout
       return {
         success: true,
         result: true,
         data: [{
           logisticName: 'Standard Shipping (Fallback)',
           logisticPrice: 5.00,
           logisticAging: '15-25',
           logisticId: 'fallback'
         }] as any,
         code: 200,
         message: 'Fallback',
         requestId: 'fallback'
       };
    }

    return res;
  } catch (err) {
    return {
      success: true,
      result: true,
      data: [{
        logisticName: 'Economy Shipping',
        logisticPrice: 4.50,
        logisticAging: '20-30',
        logisticId: 'fallback-err'
      }] as any,
      code: 200,
      message: 'Network Fallback',
      requestId: 'error-fallback'
    };
  }
}

// ── Orders ────────────────────────────────────────────────────────────────
export async function createOrder(orderData: {
  orderNumber: string;
  shippingZip?: string;
  shippingCountry: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingPhone?: string;
  shippingCustomerName: string;
  shippingAddress: string;
  shippingAddress2?: string;
  logisticName?: string;
  fromCountryCode?: string;
  payType?: number; 
  products: Array<{ vid?: string; sku?: string; quantity: number; storeLineItemId?: string }>;
}) {
  return cjFetch<any>('/v1/shopping/order/createOrderV2', {
    method: 'POST',
    body: JSON.stringify({
      fromCountryCode: orderData.fromCountryCode || 'CN',
      logisticName: orderData.logisticName || 'CJPacket Ordinary',
      platform: 'Api',
      ...orderData,
      payType: orderData.payType || 3, // Default to 3 if not provided
    }),
  });
}

export async function getDetailedTracking(cjOrderId: string) {
  return cjFetch<any>(`/v1/logistic/getLogisticsTrack?orderId=${cjOrderId}`);
}

export async function getTrackingInfo(orderId: string) {
  return cjFetch<any>(`/v1/shopping/order/getOrderDetail?orderId=${orderId}`);
}

export async function getOrderList(params: {
  pageNum?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const query = new URLSearchParams({
    pageNum: (params.pageNum || 1).toString(),
    pageSize: (params.pageSize || 10).toString(),
    ...(params.status && { status: params.status }),
  });
  return cjFetch(`/v1/shopping/order/list?${query.toString()}`);
}

export async function getCategories() {
  return cjFetch<any>('/v1/product/getCategory');
}

export async function createDispute(params: {
  orderId: string;
  businessDisputeId: string;
  disputeReasonId: number;
  expectType: number; 
  refundType: number; 
  messageText: string;
  imageUrl?: string[];
  productInfoList: Array<{ lineItemId: string; quantity: number }>;
}) {
  return cjFetch<any>('/v1/disputes/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getDisputeList(params: {
  orderId?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.orderId) query.set('orderId', params.orderId);
  query.set('pageNum', (params.pageNum || 1).toString());
  query.set('pageSize', (params.pageSize || 10).toString());
  return cjFetch<any>(`/v1/disputes/getDisputeList?${query.toString()}`);
}
