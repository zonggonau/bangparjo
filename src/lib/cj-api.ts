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
    const { redis } = await import('@/lib/redis');
    if (redis.status !== 'ready') return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('[Redis Get Cache Error]:', e);
    return null;
  }
}

export async function setCache(key: string, data: any, ttl = 1800) {
  if (typeof window !== 'undefined') return;
  try {
    const { redis } = await import('@/lib/redis');
    if (redis.status !== 'ready') return;
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
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
  
  // Only cache product-related endpoints
  const isProductEndpoint = endpoint.includes('/product/list') || endpoint.includes('/product/query');
  const cacheKey = `cj_${endpoint}_${JSON.stringify(options.body || '')}`;
  if (isGet && isProductEndpoint) {
    const cached = await getCache(cacheKey);
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

      // Only cache product-related endpoints
      if (isGet && isProductEndpoint && (data.success || data.result)) {
        await setCache(cacheKey, data);
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
    });
    
    // Fallback logic if API fails due to QPS or other issues
    if (!res.success) {
       console.warn(`[Shipping API] Failed: ${res.message}. Returning fallback.`);
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

export async function setWebhook(params: {
  product: WebhookSetting;
  stock: WebhookSetting;
  order: WebhookSetting;
  logistics: WebhookSetting;
}) {
  return cjFetch<any>('/api2.0/v1/webhook/set', {
    method: 'POST',
    body: JSON.stringify(params),
  });
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
