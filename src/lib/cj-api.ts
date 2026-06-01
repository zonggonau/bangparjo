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



export async function getCache(key: string) {
  if (typeof window !== 'undefined') return null;
  try {
    const { redis: r } = await import('@/lib/redis');
    if (!r || r.status !== 'ready') return null;
    const data = await r.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('[Redis Get Cache Error]:', e);
    return null;
  }
}

export async function setCache(key: string, data: any, ttl = 1800) {
  if (typeof window !== 'undefined') return;
  try {
    const { redis: r } = await import('@/lib/redis');
    if (!r || r.status !== 'ready') return;
    await r.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (e) {
    console.warn('[Redis Set Cache Error]:', e);
  }
}

// ── String helpers (re-exported from utils.ts for backward compat) ─────────
// These are now centralized in src/lib/utils.ts
// Import from '@/lib/utils' for new code.
export { slugify, parseProductName, parseProductImage } from '@/lib/utils';

// ── Config ────────────────────────────────────────────────────────────────
export const BASE_URL = process.env.CJ_API_BASE_URL || 'https://api.cjdropshipping.com';
const API_KEY = process.env.CJ_API_KEY;

// ── Token cache ───────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
let tokenFetchPromise: Promise<string> | null = null;

export interface CJResponse<T> {
  success: boolean;
  result: boolean;
  message: string;
  code: number;
  data: T;
  requestId: string;
}

/**
 * Auth endpoint base URL — uses the recommended api2.0/v1 path as per CJ docs
 */
const AUTH_BASE_URL = process.env.CJ_AUTH_BASE_URL || 'https://developers.cjdropshipping.com';

/**
 * Parse an ISO date string (e.g. "2021-08-18T09:16:33+08:00") to a timestamp.
 */
function parseCJDate(dateStr: string): number {
  return new Date(dateStr).getTime();
}

/**
 * Response shape from auth endpoints (getAccessToken / refreshAccessToken).
 */
interface CJTokenResponse {
  openId?: number;
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
  createDate?: string;
}

/**
 * Save token data to the database.
 */
async function saveTokensToDB(
  prisma: any,
  accessToken: string,
  accessExpiry: number,
  refreshToken: string,
  refreshExpiry: number,
): Promise<void> {
  await prisma.storeSetting.upsert({
    where: { key: 'CJ_ACCESS_TOKEN' },
    update: { value: accessToken },
    create: { key: 'CJ_ACCESS_TOKEN', value: accessToken },
  });
  await prisma.storeSetting.upsert({
    where: { key: 'CJ_TOKEN_EXPIRY' },
    update: { value: accessExpiry.toString() },
    create: { key: 'CJ_TOKEN_EXPIRY', value: accessExpiry.toString() },
  });
  await prisma.storeSetting.upsert({
    where: { key: 'CJ_REFRESH_TOKEN' },
    update: { value: refreshToken },
    create: { key: 'CJ_REFRESH_TOKEN', value: refreshToken },
  });
  await prisma.storeSetting.upsert({
    where: { key: 'CJ_REFRESH_TOKEN_EXPIRY' },
    update: { value: refreshExpiry.toString() },
    create: { key: 'CJ_REFRESH_TOKEN_EXPIRY', value: refreshExpiry.toString() },
  });
}

/**
 * Call the CJ refresh token endpoint (POST /api2.0/v1/authentication/refreshAccessToken).
 *
 * As per CJ docs:
 * - Access token life: 15 days
 * - Refresh token life: 180 days
 * - Token Caching: same token returned within 24 hours (server-side cache)
 */
async function refreshAccessTokenFromCJ(
  refreshToken: string,
  prisma: any,
): Promise<{ accessToken: string; accessExpiry: number }> {
  const url = `${AUTH_BASE_URL}/api2.0/v1/authentication/refreshAccessToken`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json();

  if (!data.success && !data.result) {
    throw new Error(data.message || 'Refresh token failed');
  }

  const tokenData: CJTokenResponse = data.data;
  const accessExpiry = parseCJDate(tokenData.accessTokenExpiryDate);
  const refreshExpiry = parseCJDate(tokenData.refreshTokenExpiryDate);

  await saveTokensToDB(prisma, tokenData.accessToken, accessExpiry, tokenData.refreshToken, refreshExpiry);

  return { accessToken: tokenData.accessToken, accessExpiry };
}

export async function getAccessTokenServer(): Promise<string> {
  // 1. In-memory cache check
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken!;
  }

  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  tokenFetchPromise = (async () => {
    let prisma: any;
    try {
      const db = await import('@/lib/db');
      prisma = db.prisma;
    } catch {
      // DB not available, fall back to direct API call
    }

    if (prisma) {
      try {
        const [dbToken, dbExpiry, dbRefreshToken, dbRefreshExpiry] = await Promise.all([
          prisma.storeSetting.findUnique({ where: { key: 'CJ_ACCESS_TOKEN' } }),
          prisma.storeSetting.findUnique({ where: { key: 'CJ_TOKEN_EXPIRY' } }),
          prisma.storeSetting.findUnique({ where: { key: 'CJ_REFRESH_TOKEN' } }),
          prisma.storeSetting.findUnique({ where: { key: 'CJ_REFRESH_TOKEN_EXPIRY' } }),
        ]);

        // 2. Access token still valid → use it
        if (dbToken && dbExpiry && Date.now() < parseInt(dbExpiry.value)) {
          cachedToken = dbToken.value;
          tokenExpiry = parseInt(dbExpiry.value);
          return cachedToken!;
        }

        // 3. Access token expired, but refresh token still valid → refresh
        if (dbRefreshToken && dbRefreshExpiry && Date.now() < parseInt(dbRefreshExpiry.value)) {
          try {
            await waitForSlot();
            const result = await refreshAccessTokenFromCJ(dbRefreshToken.value, prisma);
            cachedToken = result.accessToken;
            tokenExpiry = result.accessExpiry;
            return cachedToken;
          } catch (err) {
            console.warn('[Token Refresh Failed]:', err);
            try {
               await prisma.storeSetting.deleteMany({
                 where: { key: { in: ['CJ_REFRESH_TOKEN', 'CJ_REFRESH_TOKEN_EXPIRY'] } }
               });
            } catch (e) {}
            // Fall through to full re-auth
          }
        }
      } catch (e) {
        console.error('[Token DB Load Error]:', e);
      }
    }

    // 4. Double-check in-memory (in case another concurrent call already fetched)
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      return cachedToken!;
    }

    // 5. Full re-authentication with API key
    await waitForSlot();

    const url = `${AUTH_BASE_URL}/api2.0/v1/authentication/getAccessToken`;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: API_KEY }),
        });
        const data: CJResponse<CJTokenResponse> = await response.json();

        if (!data.success && !data.result) {
          if (data.message?.includes('QPS limit') || data.code === 1600100) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            continue;
          }
          throw new Error(data.message || 'Auth failed');
        }

        const tokenData: CJTokenResponse = data.data;
        cachedToken = tokenData.accessToken;
        tokenExpiry = parseCJDate(tokenData.accessTokenExpiryDate);

        if (prisma) {
          try {
            const refreshExpiry = parseCJDate(tokenData.refreshTokenExpiryDate);
            await saveTokensToDB(prisma, cachedToken, tokenExpiry, tokenData.refreshToken, refreshExpiry);
          } catch (e) {
            console.error('[Token DB Save Error]:', e);
          }
        }

        return cachedToken!;
      } catch (err: any) {
        if (retryCount >= maxRetries) throw err;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    throw new Error('Failed to get CJ access token after retries');
  })();

  try {
    return await tokenFetchPromise;
  } finally {
    tokenFetchPromise = null;
  }
}

// ── Generic fetcher ───────────────────────────────────────────────────────
export async function cjFetch<T>(
  endpoint: string,
  options: RequestInit & { next?: { revalidate?: number | false; tags?: string[] }; timeout?: number; maxRetries?: number } = {}
): Promise<CJResponse<T>> {
  if (typeof window !== 'undefined') {
    const { cjProxyAction } = await import('@/lib/actions-catalog');
    
    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    if (isGet) {
      return (await cjProxyAction(endpoint, { method: 'GET' })) as CJResponse<T>;
    }
    
    return (await cjProxyAction(endpoint, {
      method: options.method,
      headers: options.headers,
      body: options.body ? JSON.parse(options.body as string) : undefined,
    })) as CJResponse<T>;
  }

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  
  // Only cache product-related endpoints
  const isProductEndpoint = endpoint.includes('/product/list') || endpoint.includes('/product/query');
  const cacheKey = `cj_${endpoint}_${JSON.stringify(options.body || '')}`;
  if (isGet && isProductEndpoint) {
    const cached = await getCache(cacheKey);
    if (cached) return cached;
  }

  // ── Fix double-path: BASE_URL already includes /api2.0, so strip it from endpoints ──
  const cleanEndpoint = endpoint.replace(/^\/api2\.0/, '');
  
  // ── AbortController with 20-second timeout ──
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  let retryCount = 0;
  const maxRetries = 3; // Reduce to 3 to avoid excessive spinning

  while (retryCount < maxRetries) {
    try {
      const token = await getAccessTokenServer();
      await waitForSlot();

      const fetchOptions: any = {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'CJ-Access-Token': token,
          ...(options.headers as Record<string, string>),
        },
      };

      if (isGet && !fetchOptions.next && !fetchOptions.cache) {
        fetchOptions.next = { revalidate: 3600 };
      }

      const response = await fetch(`${BASE_URL}${cleanEndpoint}`, fetchOptions);
      const data = await response.json();

      // Handle Invalid/Expired Token (Retry once with fresh token)
      if (!data.success && !data.result && (data.code === 1600101 || data.code === 1600102 || data.message?.toLowerCase().includes('access token'))) {
        if (retryCount === 0) {
          console.warn(`[CJ API] Token invalid or expired. Calling explicit logout to flush CJ cache and retrying...`);
          
          // ── Explicitly call Logout to flush CJ's 24-hour server-side cache! ──
          try {
            await fetch(`${AUTH_BASE_URL}/api2.0/v1/authentication/logout`, {
              method: 'POST',
              headers: { 'CJ-Access-Token': token },
            });
          } catch (e) {
            // Ignore logout failure
          }

          cachedToken = null;
          tokenExpiry = null;
          try {
            const { prisma } = await import('@/lib/db');
            await prisma.storeSetting.deleteMany({
              where: { key: { in: ['CJ_ACCESS_TOKEN', 'CJ_TOKEN_EXPIRY', 'CJ_REFRESH_TOKEN', 'CJ_REFRESH_TOKEN_EXPIRY'] } }
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
        // For non-critical endpoints (reviews/comments), fail fast instead of retrying
        const isNonCritical = endpoint.includes('productComments') || endpoint.includes('reviews');
        if (isNonCritical) {
          clearTimeout(timeoutId);
          return { success: false, result: false, message: 'QPS limit - skipping', code: 1600100, data: null as unknown as T, requestId: '' };
        }
        retryCount++;
        // Exponential backoff with jitter: 2s, 4s, 8s, 16s...
        const baseWait = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        const wait = baseWait + jitter;
        
        console.warn(`[CJ API] QPS Limit on ${endpoint}. Retrying in ${Math.round(wait)}ms (Attempt ${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }

      // Only cache product-related endpoints
      if (isGet && isProductEndpoint && (data.success || data.result)) {
        await setCache(cacheKey, data);
      }
      clearTimeout(timeoutId);
      return data;
    } catch (err: any) {
      if (retryCount >= maxRetries) throw err;
      retryCount++;
      const wait = 2000 * retryCount;
      await new Promise(resolve => setTimeout(resolve, wait));
    }
  }
  clearTimeout(timeoutId);
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
  isCouponProduct?: boolean;
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
    productFlag?: number; // 0=all products
  } = {}
): Promise<CJResponse<{ list: CJProduct[]; total: number }>> {
  const query = new URLSearchParams({
    pageNum: (params.pageNum || 1).toString(),
    pageSize: (params.pageSize || 20).toString(),
  });
  if (params.keyWord) query.set('keyWord', params.keyWord);
  if (params.productSku) query.set('productSku', params.productSku);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.countryCode) query.set('countryCode', params.countryCode);
  if (params.minPrice != null) query.set('minPrice', params.minPrice.toString());
  if (params.maxPrice != null) query.set('maxPrice', params.maxPrice.toString());
  if (params.searchType != null) query.set('searchType', params.searchType.toString());
  if (params.productFlag != null) query.set('productFlag', params.productFlag.toString());

  return cjFetch(`/v1/product/list?${query.toString()}`);
}

/**
 * Product List V2 — uses Elasticsearch for higher performance product search.
 * Supports keyword search, multiple filter conditions, sorting, and features.
 * 
 * Endpoint: GET /api2.0/v1/product/listV2
 * 
 * Response structure:
 * {
 *   data: {
 *     pageSize: number,
 *     pageNumber: number,
 *     totalRecords: number,
 *     totalPages: number,
 *     content: [{
 *       productList: CJProductV2[],
 *       relatedCategoryList: [...],
 *       keyWord: string
 *     }]
 *   }
 * }
 */
export interface CJProductV2 {
  id: string;           // Product ID (pid)
  nameEn: string;       // English product name
  sku: string;          // Product SKU
  spu: string;          // Product SPU
  bigImage: string;     // Main product image URL
  sellPrice: string;    // Original sell price (string)
  nowPrice: string;     // Current/discounted price (string)
  listedNum: number;    // Number of listings
  categoryId: string;   // Third-level category ID
  threeCategoryName: string;
  twoCategoryId: string;
  twoCategoryName: string;
  oneCategoryId: string;
  oneCategoryName: string;
  addMarkStatus: number; // 0=not free shipping, 1=free shipping
  isVideo: number;
  videoList: string[];
  productType: string;
  supplierName: string;
  createAt: number;     // Timestamp (ms)
  warehouseInventoryNum: number;
  totalVerifiedInventory: number;
  totalUnVerifiedInventory: number;
  verifiedWarehouse: number;
  customization: number;
  hasCECertification: number;
  isCollect: number;
  myProduct: boolean;
  discountPrice: string;
  discountPriceRate: string;
  description?: string; // Only returned if features includes 'enable_description'
  deliveryCycle: string;
  saleStatus: string;
  authorityStatus: string;
  isPersonalized: number;
}

export async function getProductsV2(
  params: {
    page?: number;
    size?: number;
    keyWord?: string;
    categoryId?: string;
    lv2categoryList?: string[];
    lv3categoryList?: string[];
    countryCode?: string;
    startSellPrice?: number;
    endSellPrice?: number;
    addMarkStatus?: number;     // 0=not free shipping, 1=free shipping
    productType?: number;       // 4=Supplier, 10=Video, 11=Non-video
    productFlag?: number;       // 0=Trending, 1=New, 2=Video, 3=Slow-moving
    startWarehouseInventory?: number;
    endWarehouseInventory?: number;
    verifiedWarehouse?: number; // 0=All, 1=Verified, 2=Unverified
    timeStart?: number;         // Timestamp ms
    timeEnd?: number;           // Timestamp ms
    zonePlatform?: string;      // shopify, ebay, amazon, tiktok, etsy
    isWarehouse?: boolean;
    sort?: 'desc' | 'asc';
    orderBy?: number;           // 0=best match, 1=listing count, 2=sell price, 3=create time, 4=inventory
    features?: string[];        // enable_description, enable_category, enable_combine, enable_video
    supplierId?: string;
    hasCertification?: number;  // 0=No, 1=Yes
    isSelfPickup?: number;      // 0=No, 1=Yes
    customization?: number;     // 0=No, 1=Yes
  } = {}
): Promise<CJResponse<{
  pageSize: number;
  pageNumber: number;
  totalRecords: number;
  totalPages: number;
  content: Array<{
    productList: CJProductV2[];
    relatedCategoryList: Array<{ categoryId: string; categoryName: string }>;
    keyWord: string;
  }>;
}>> {
  const query = new URLSearchParams();
  if (params.page != null) query.set('page', params.page.toString());
  if (params.size != null) query.set('size', params.size.toString());
  if (params.keyWord) query.set('keyWord', params.keyWord);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.lv2categoryList?.length) query.set('lv2categoryList', JSON.stringify(params.lv2categoryList));
  if (params.lv3categoryList?.length) query.set('lv3categoryList', JSON.stringify(params.lv3categoryList));
  if (params.countryCode) query.set('countryCode', params.countryCode);
  if (params.startSellPrice != null) query.set('startSellPrice', params.startSellPrice.toString());
  if (params.endSellPrice != null) query.set('endSellPrice', params.endSellPrice.toString());
  if (params.addMarkStatus != null) query.set('addMarkStatus', params.addMarkStatus.toString());
  if (params.productType != null) query.set('productType', params.productType.toString());
  if (params.productFlag != null) query.set('productFlag', params.productFlag.toString());
  if (params.startWarehouseInventory != null) query.set('startWarehouseInventory', params.startWarehouseInventory.toString());
  if (params.endWarehouseInventory != null) query.set('endWarehouseInventory', params.endWarehouseInventory.toString());
  if (params.verifiedWarehouse != null) query.set('verifiedWarehouse', params.verifiedWarehouse.toString());
  if (params.timeStart != null) query.set('timeStart', params.timeStart.toString());
  if (params.timeEnd != null) query.set('timeEnd', params.timeEnd.toString());
  if (params.zonePlatform) query.set('zonePlatform', params.zonePlatform);
  if (params.isWarehouse != null) query.set('isWarehouse', params.isWarehouse.toString());
  if (params.sort) query.set('sort', params.sort);
  if (params.orderBy != null) query.set('orderBy', params.orderBy.toString());
  if (params.features?.length) query.set('features', JSON.stringify(params.features));
  if (params.supplierId) query.set('supplierId', params.supplierId);
  if (params.hasCertification != null) query.set('hasCertification', params.hasCertification.toString());
  if (params.isSelfPickup != null) query.set('isSelfPickup', params.isSelfPickup.toString());
  if (params.customization != null) query.set('customization', params.customization.toString());

  return cjFetch(`/api2.0/v1/product/listV2?${query.toString()}`);
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
  // No Redis caching - langsung hit API
  const reqDTOS = [{
    srcAreaCode: params.startCountryCode || 'CN',
    destAreaCode: params.endCountryCode,
    volume: 0.001,
    totalGoodsAmount: params.products.reduce((sum, p) => sum + (p.price || 10) * p.quantity, 0),
    productProp: ['COMMON'],
    freightTrialSkuList: params.products.map(p => {
      const item: any = {
        sku: p.sku,
        skuQuantity: p.quantity,
      };
      if (p.weight) item.skuWeight = p.weight;
      return item;
    }),
    skuList: params.products.map(p => p.sku),
    platforms: ['API'],
  }];

  try {
    const res = await cjFetch<any>('/v1/logistic/freightCalculateTip', {
      method: 'POST',
      body: JSON.stringify({ reqDTOS }),
      timeout: 10000,
      maxRetries: 0,
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
  // No Redis caching - langsung hit API
  try {
    const res = await cjFetch<CJShippingMethod[]>('/v1/logistic/freightCalculate', {
      method: 'POST',
      body: JSON.stringify({
        startCountryCode: params.startCountryCode || 'CN',
        endCountryCode: params.endCountryCode,
        products: params.products,
      }),
      timeout: 10000,
      maxRetries: 0,
    });
    
    // Fallback logic if API fails due to QPS or other issues
    if (!res.success) {
       console.warn(`[Shipping API] Failed: ${res.message}`);
    }

    return res;
  } catch (err: any) {
    console.warn('[Shipping API] Error:', err);
    return {
      success: false,
      result: false,
      data: [] as any,
      code: 500,
      message: err.message || 'Network Error',
      requestId: 'error'
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
  iossType?: number;
  iossNumber?: string;
  shopLogisticsType?: number;
  platformToken?: string;
  products: Array<{ vid?: string; sku?: string; quantity: number; storeLineItemId?: string }>;
}) {
  const { platformToken, ...restData } = orderData;
  const headers: any = {};
  if (platformToken) headers['platformToken'] = platformToken;

  return cjFetch<any>('/v1/shopping/order/createOrderV2', {
    method: 'POST',
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: JSON.stringify({
      fromCountryCode: restData.fromCountryCode || 'CN',
      logisticName: restData.logisticName || 'CJPacket Ordinary',
      platform: 'Api',
      ...restData,
      iossType: (restData as any).iossType || 1, // Fix CJ Europe IOSS error (Use 1: Don't use IOSS)
      payType: restData.payType || 3, // Default to 3 if not provided
      shopLogisticsType: restData.shopLogisticsType || 2, // Default to 2 (Seller Logistics)
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
  // No Redis caching - langsung ambil dari CJ API
  const res = await cjFetch<any>('/v1/product/getCategory');
  return res;
}

export async function createDispute(params: {
  orderId: string;
  businessDisputeId: string;
  disputeReasonId: number;
  expectType: number;
  refundType: number;
  messageText: string;
  imageUrl?: string[];
  videoUrl?: string[];
  productInfoList: Array<{ lineItemId: string; quantity: number; price: number }>;
}) {
  return cjFetch<any>('/v1/disputes/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getDisputeList(params: {
  orderId?: string;
  disputeId?: string;
  orderNumber?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();
  if (params.orderId) query.set('orderId', params.orderId);
  if (params.disputeId) query.set('disputeId', params.disputeId);
  if (params.orderNumber) query.set('orderNumber', params.orderNumber);
  query.set('pageNum', (params.pageNum || 1).toString());
  query.set('pageSize', (params.pageSize || 10).toString());
  return cjFetch<any>(`/v1/disputes/getDisputeList?${query.toString()}`);
}

export async function getDisputeProducts(orderId: string) {
  return cjFetch<any>(`/v1/disputes/disputeProducts?orderId=${orderId}`);
}

export async function confirmDispute(params: {
  orderId: string;
  productInfoList: Array<{ lineItemId: string; quantity: number; price: number }>;
}) {
  return cjFetch<any>('/v1/disputes/disputeConfirmInfo', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function cancelDispute(params: {
  orderId: string;
  disputeId: string;
}) {
  return cjFetch<any>('/v1/disputes/cancel', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getDisputeDetail(disputeId: string) {
  return cjFetch<any>(`/v1/disputes/getDisputeDetail?disputeId=${disputeId}`);
}

// ── Webhook APIs ──────────────────────────────────────────────────────────

/**
 * Webhook Message Setting (POST)
 * Endpoint: /api2.0/v1/webhook/set
 * Configure webhook callback URLs for product, stock, order, and logistics events.
 * 
 * Each event type can be set to "ENABLE" or "CANCEL" with a callback URL array.
 * Only one callback URL is supported per event type, and it must be a public HTTPS URL.
 */
export interface WebhookSetting {
  type: 'ENABLE' | 'CANCEL';
  callbackUrls: string[];
}

/**
 * Set webhook configuration via CJ Auth API base URL.
 * NOTE: This endpoint uses AUTH_BASE_URL (developers.cjdropshipping.com)
 * instead of the regular API BASE_URL (api.cjdropshipping.com).
 * We use direct fetch here because cjFetch() strips /api2.0 prefix
 * and routes to the wrong base URL.
 */
export async function setWebhook(params: {
  product: WebhookSetting;
  stock: WebhookSetting;
  order: WebhookSetting;
  logistics: WebhookSetting;
}) {
  const token = await getAccessTokenServer();
  const url = `${AUTH_BASE_URL}/api2.0/v1/webhook/set`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  return data;
}

// ── Variant APIs ──────────────────────────────────────────────────────────

/**
 * Inquiry Of All Variants (GET)
 * Endpoint: /api2.0/v1/product/variant/query
 * Get all variants for a product by PID.
 */
export interface CJVariantDetail {
  vid: string;
  pid: string;
  variantName: string | null;
  variantNameEn: string;
  variantImage?: string;
  variantSku: string;
  variantUnit: string | null;
  variantKey: string;
  variantLength: number;
  variantWidth: number;
  variantHeight: number;
  variantVolume: number;
  variantWeight: number;
  variantSellPrice: number;
  createTime: string;
  variantStandard: string;
  variantSugSellPrice?: number;
}

export async function getProductVariants(pid: string): Promise<CJResponse<CJVariantDetail[]>> {
  return cjFetch<CJVariantDetail[]>(`/api2.0/v1/product/variant/query?pid=${pid}`);
}

/**
 * Variant Id Inquiry (GET)
 * Endpoint: /api2.0/v1/product/variant/queryByVid
 * Get variant details by VID, with optional inventory info.
 */
export interface CJVariantInventory {
  countryCode: string;
  totalInventory: number;
  cjInventory: number;
  factoryInventory: number;
  verifiedWarehouse: number; // 1=verified, 2=unverified
  stock: Array<{
    stockId: string;
    inventory: number;
    factoryInventory: number;
  }>;
}

export interface CJVariantWithInventory extends CJVariantDetail {
  inventories: CJVariantInventory[];
}

export async function getVariantById(vid: string, includeInventory = false): Promise<CJResponse<CJVariantWithInventory>> {
  let endpoint = `/api2.0/v1/product/variant/queryByVid?vid=${vid}`;
  if (includeInventory) {
    endpoint += '&features=enable_inventory';
  }
  return cjFetch<CJVariantWithInventory>(endpoint);
}

// ── Inventory APIs ────────────────────────────────────────────────────────

/**
 * Inventory Inquiry by VID (GET)
 * Endpoint: /api2.0/v1/product/stock/queryByVid
 */
export interface CJWarehouseStock {
  vid: string;
  areaId: string;
  areaEn: string;
  countryCode: string;
  storageNum: number;
  totalInventoryNum: number;
  cjInventoryNum: number;
  factoryInventoryNum: number;
  stock: Array<{
    stockId: string;
    inventory: number;
    factoryInventory: number;
  }> | null;
}

export async function getInventoryByVid(vid: string): Promise<CJResponse<CJWarehouseStock[]>> {
  return cjFetch<CJWarehouseStock[]>(`/api2.0/v1/product/stock/queryByVid?vid=${vid}`);
}

/**
 * Query Inventory by SKU (GET)
 * Endpoint: /api2.0/v1/product/stock/queryBySku
 */
export interface CJStockBySku extends CJWarehouseStock {
  countryNameEn: string;
}

export async function getInventoryBySku(sku: string): Promise<CJResponse<CJStockBySku[]>> {
  return cjFetch<CJStockBySku[]>(`/api2.0/v1/product/stock/queryBySku?sku=${sku}`);
}

/**
 * Query Inventory by Product ID (GET)
 * Endpoint: /api2.0/v1/product/stock/getInventoryByPid
 */
export interface CJProductInventory {
  inventories: Array<{
    areaEn: string;
    areaId: number;
    countryCode: string;
    totalInventoryNum: number;
    cjInventoryNum: number;
    factoryInventoryNum: number;
    countryNameEn: string;
    stock: Array<{
      stockId: string;
      inventory: number;
      factoryInventory: number;
    }> | null;
  }>;
  variantInventories: Array<{
    vid: string;
    inventory: CJVariantInventory[];
  }>;
}

export async function getInventoryByPid(pid: string): Promise<CJResponse<CJProductInventory>> {
  return cjFetch<CJProductInventory>(`/api2.0/v1/product/stock/getInventoryByPid?pid=${pid}`);
}

// ── Product Reviews APIs ──────────────────────────────────────────────────

/**
 * Inquiry Reviews (GET) — New API
 * Endpoint: /api2.0/v1/product/productComments
 */
export interface CJProductReview {
  commentId: number;
  pid: string;
  comment: string;
  commentDate: string;
  commentUser: string;
  score: string;
  commentUrls: string[];
  countryCode: string;
  flagIconUrl: string;
}

export interface CJProductReviewsResponse {
  pageNum: string;
  pageSize: string;
  total: string;
  list: CJProductReview[];
}

export async function getProductReviews(
  pid: string,
  params: {
    score?: number;
    pageNum?: number;
    pageSize?: number;
  } = {}
): Promise<CJResponse<CJProductReviewsResponse>> {
  const query = new URLSearchParams({ pid });
  if (params.score != null) query.set('score', params.score.toString());
  if (params.pageNum != null) query.set('pageNum', params.pageNum.toString());
  if (params.pageSize != null) query.set('pageSize', params.pageSize.toString());
  return cjFetch<CJProductReviewsResponse>(`/api2.0/v1/product/productComments?${query.toString()}`);
}

// ── Global Warehouse List API ─────────────────────────────────────────────

/**
 * Global Warehouse List (GET)
 * Endpoint: /api2.0/v1/product/globalWarehouseList
 */
export interface CJGlobalWarehouse {
  areaId: number;
  areaEn: string;
  areaCn: string;
  countryCode: string;
  countryNameEn: string;
  countryNameCn: string;
  isDefault: number;
}

export async function getGlobalWarehouseList(): Promise<CJResponse<CJGlobalWarehouse[]>> {
  return cjFetch<CJGlobalWarehouse[]>('/api2.0/v1/product/globalWarehouseList');
}

// ── Warehouse / Storage Detail API ─────────────────────────────────────────

/**
 * Warehouse Detail (GET)
 * Endpoint: /api2.0/v1/warehouse/detail
 * Get detailed info about a specific warehouse/storage by its ID.
 */
export interface CJWarehouseDetail {
  id: string;
  name: string;
  areaId: number;
  areaCountryCode: string;
  address1: string | null;
  address2: string | null;
  contacts: string | null;
  phone: string | null;
  city: string;
  province: string;
  logisticsBrandList: Array<{
    id: string;
    name: string;
  }>;
  isSelfPickup: number | null; // 1: support, 0: not supported
  zipCode: string | null;
}

export async function getWarehouseDetail(id: string): Promise<CJResponse<CJWarehouseDetail>> {
  return cjFetch<CJWarehouseDetail>(`/api2.0/v1/warehouse/detail?id=${encodeURIComponent(id)}`);
}

// ── My Product APIs ───────────────────────────────────────────────────────

/**
 * My Product List (GET)
 * Endpoint: /api2.0/v1/product/myProduct/query
 */
export interface CJMyProduct {
  pid: string;
  productName: string;
  productImage: string;
  sellPrice: number;
  isListed: number;
  visiable: number;
  createTime: string;
}

export async function getMyProducts(params: {
  keyword?: string;
  categoryId?: string;
  isListed?: number;
  visiable?: number;
  pageNum?: number;
  pageSize?: number;
} = {}): Promise<CJResponse<{ list: CJMyProduct[]; total: number }>> {
  const query = new URLSearchParams();
  if (params.keyword) query.set('keyword', params.keyword);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.isListed != null) query.set('isListed', params.isListed.toString());
  if (params.visiable != null) query.set('visiable', params.visiable.toString());
  if (params.pageNum != null) query.set('pageNum', params.pageNum.toString());
  if (params.pageSize != null) query.set('pageSize', params.pageSize.toString());
  return cjFetch(`/api2.0/v1/product/myProduct/query?${query.toString()}`);
}

/**
 * Add to My Product (POST)
 * Endpoint: /api2.0/v1/product/addToMyProduct
 */
export async function addToMyProduct(params: {
  pid: string;
  vid?: string;
  sku?: string;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/product/addToMyProduct', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── Sourcing APIs ─────────────────────────────────────────────────────────

/**
 * Create Sourcing (POST)
 * Endpoint: /api2.0/v1/product/sourcing/create
 */
export async function createSourcing(params: {
  productName: string;
  productImage: string;
  thirdProductId?: string;
  thirdVariantId?: string;
  thirdProductSku?: string;
  productUrl?: string;
  remark?: string;
  price?: number;
}): Promise<CJResponse<{ cjSourcingId: string; result: string }>> {
  return cjFetch<any>('/api2.0/v1/product/sourcing/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Query Sourcing (POST)
 * Endpoint: /api2.0/v1/product/sourcing/query
 */
export interface CJSourcingResult {
  sourceId: string;
  sourceNumber: string;
  productId: string;
  variantId: string;
  shopId: string;
  shopName: string;
  sourceStatus: string;
  sourceStatusStr: string;
  cjProductId: string;
  cjVariantSku: string;
}

export async function querySourcing(sourceIds: string[]): Promise<CJResponse<CJSourcingResult[]>> {
  return cjFetch<CJSourcingResult[]>('/api2.0/v1/product/sourcing/query', {
    method: 'POST',
    body: JSON.stringify({ sourceIds }),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// Missing API Implementations (from reference table)
// ════════════════════════════════════════════════════════════════════════════

// ── Authentication: Others ────────────────────────────────────────────────

/**
 * Logout (POST)
 * Endpoint: /api2.0/v1/authentication/logout
 * Invalidates the current access token and refresh token.
 */
export async function logout(): Promise<CJResponse<boolean>> {
  return cjFetch<boolean>('/api2.0/v1/authentication/logout', {
    method: 'POST',
  });
}

/**
 * Get Authorize URL (GET)
 * Endpoint: /api2.0/v1/authentication/getAuthorizeUrl
 * Returns the authorization URL for OAuth flow.
 */
export async function getAuthorizeUrl(params: {
  redirectUri: string;
  state?: string;
}): Promise<CJResponse<{ authorizeUrl: string }>> {
  const query = new URLSearchParams({ redirectUri: params.redirectUri });
  if (params.state) query.set('state', params.state);
  return cjFetch<{ authorizeUrl: string }>(`/api2.0/v1/authentication/getAuthorizeUrl?${query.toString()}`);
}

/**
 * Exchange Access Token (POST)
 * Endpoint: /api2.0/v1/authentication/exchangeAccessToken
 * Exchange authorization code for an access token.
 */
export interface CJExchangeTokenResponse {
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
}

export async function exchangeAccessToken(params: {
  code: string;
  redirectUri: string;
}): Promise<CJResponse<CJExchangeTokenResponse>> {
  return cjFetch<CJExchangeTokenResponse>('/api2.0/v1/authentication/exchangeAccessToken', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get Affiliate Access Token (POST)
 * Endpoint: /api2.0/v1/authentication/getAffiliateAccessToken
 * Get access token with affiliate privileges.
 */
export async function getAffiliateAccessToken(params: {
  apiKey: string;
}): Promise<CJResponse<CJTokenResponse>> {
  return cjFetch<CJTokenResponse>('/api2.0/v1/authentication/getAffiliateAccessToken', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── Settings ───────────────────────────────────────────────────────────────

/**
 * Get Settings (GET)
 * Endpoint: /api2.0/v1/setting/get
 * Returns the current CJ account settings.
 */
export interface CJSetting {
  key: string;
  value: string;
  description?: string;
}

export async function getSettings(): Promise<CJResponse<CJSetting[]>> {
  return cjFetch<CJSetting[]>('/api2.0/v1/setting/get');
}

// ── Shopping: Order (V1 & V3) ─────────────────────────────────────────────

/**
 * Create Order V1 (POST)
 * Endpoint: /api2.0/v1/shopping/order/createOrder
 * Original create order endpoint.
 */
export async function createOrderV1(orderData: {
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
  products: Array<{ vid?: string; sku?: string; quantity: number }>;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/order/createOrder', {
    method: 'POST',
    body: JSON.stringify({
      fromCountryCode: orderData.fromCountryCode || 'CN',
      logisticName: orderData.logisticName || 'CJPacket Ordinary',
      platform: 'Api',
      ...orderData,
      payType: orderData.payType || 3,
    }),
  });
}

/**
 * Create Order V3 (POST)
 * Endpoint: /api2.0/v1/shopping/order/createOrderV3
 * Enhanced order creation with additional fields.
 */
export async function createOrderV3(orderData: {
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
  shippingEmail?: string;
  logisticName?: string;
  fromCountryCode?: string;
  payType?: number;
  remark?: string;
  warehouseId?: string;
  products: Array<{
    vid?: string;
    sku?: string;
    quantity: number;
    storeLineItemId?: string;
    warehouseId?: string;
  }>;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/order/createOrderV3', {
    method: 'POST',
    body: JSON.stringify({
      fromCountryCode: orderData.fromCountryCode || 'CN',
      logisticName: orderData.logisticName || 'CJPacket Ordinary',
      platform: 'Api',
      ...orderData,
      payType: orderData.payType || 3,
    }),
  });
}

/**
 * Order Confirmation (PATCH)
 * Endpoint: /api2.0/v1/shopping/order/confirmOrder
 * Confirm and submit an order that was created in draft mode.
 */
export async function confirmOrder(params: {
  orderNumber: string;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/order/confirmOrder', {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}

// ── Shopping: Payment ──────────────────────────────────────────────────────

/**
 * Get Balance (GET)
 * Endpoint: /api2.0/v1/shopping/pay/getBalance
 * Returns the current account balance.
 */
export interface CJBalance {
  balance: number;
  balanceStr: string;
  currency: string;
}

export async function getBalance(): Promise<CJResponse<CJBalance>> {
  return cjFetch<CJBalance>('/api2.0/v1/shopping/pay/getBalance');
}

/**
 * Balance Payment (POST)
 * Endpoint: /api2.0/v1/shopping/pay/payBalance
 * Pay for an order using the account balance.
 */
export async function payBalance(params: {
  orderNumber: string;
  payPassword?: string;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/pay/payBalance', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Balance Payment V2 (POST)
 * Endpoint: /api2.0/v1/shopping/pay/payBalanceV2
 * Enhanced balance payment with more options.
 */
export async function payBalanceV2(params: {
  orderNumbers: string[];
  payPassword?: string;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/shopping/pay/payBalanceV2', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── Logistics: Calculate ───────────────────────────────────────────────────

/**
 * Partner Freight Calculate (POST)
 * Endpoint: /api2.0/v1/logistic/partnerFreightCalculate
 * Calculate shipping cost using partner logistics.
 */
export interface CJPartnerFreightRequest {
  startCountryCode?: string;
  endCountryCode: string;
  weight: number;
  volume?: number;
  totalGoodsAmount?: number;
  productProp?: string[];
}

export async function partnerFreightCalculate(params: CJPartnerFreightRequest): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/logistic/partnerFreightCalculate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get Supplier Logistics Template (POST)
 * Endpoint: /api2.0/v1/logistic/getSupplierLogisticsTemplate
 * Get logistics template for a supplier product.
 */
export async function getSupplierLogisticsTemplate(params: {
  productId: string;
  countryCode: string;
  quantity?: number;
}): Promise<CJResponse<any>> {
  return cjFetch<any>('/api2.0/v1/logistic/getSupplierLogisticsTemplate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── Logistics: Tracking ────────────────────────────────────────────────────

/**
 * Track Query (Deprecated) (GET)
 * Endpoint: /api2.0/v1/logistic/getTrackInfo
 * Get tracking information for a shipment (deprecated — use trackInfo instead).
 */
export interface CJTrackInfo {
  trackingNumber: string;
  logisticName: string;
  trackingFrom: string;
  trackingTo: string;
  deliveryDay: string;
  deliveryTime: string;
  trackingStatus: string;
  lastMileCarrier: string;
  lastTrackNumber: string;
}

/**
 * Track Query (Deprecated) (GET)
 * Endpoint: /api2.0/v1/logistic/getTrackInfo
 */
export async function getTrackInfo(trackNumbers: string | string[]): Promise<CJResponse<CJTrackInfo[]>> {
  const params = Array.isArray(trackNumbers) ? trackNumbers : [trackNumbers];
  const query = params.map(t => `trackNumber=${encodeURIComponent(t)}`).join('&');
  return cjFetch<CJTrackInfo[]>(`/api2.0/v1/logistic/getTrackInfo?${query}`);
}

/**
 * Track Query (GET)
 * Endpoint: /api2.0/v1/logistic/trackInfo
 * Get comprehensive tracking information for shipments.
 */
export async function trackInfo(trackNumbers: string | string[]): Promise<CJResponse<CJTrackInfo[]>> {
  const params = Array.isArray(trackNumbers) ? trackNumbers : [trackNumbers];
  const query = params.map(t => `trackNumber=${encodeURIComponent(t)}`).join('&');
  return cjFetch<CJTrackInfo[]>(`/api2.0/v1/logistic/trackInfo?${query}`);
}
