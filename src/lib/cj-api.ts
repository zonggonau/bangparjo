const pendingRequests = new Map<string, Promise<any>>();
let activeSyncJob: { 
  categoryId: string; 
  total: number; 
  processed: number; 
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  message: string;
} = { categoryId: '', total: 0, processed: 0, status: 'IDLE', message: '' };

export function getSyncStatus() {
  return activeSyncJob;
}

async function waitForSlot(): Promise<void> {
  if (typeof window !== 'undefined') return;
  
  const fs = require('fs');
  const path = require('path');

  const LOCK_DIR = path.join(process.cwd(), '.cj_api_lock');
  const TS_FILE = path.join(process.cwd(), '.cj_last_request');
  const COOLDOWN_FILE = path.join(process.cwd(), '.cj_429_cooldown');
  const MIN_INTERVAL_MS = 3500; // Increased for stability
  
  let lockAcquired = false;
  let attempts = 0;

  while (!lockAcquired && attempts < 150) {
    // 1. Re-check Global 429 Cooldown inside the loop
    try {
      if (fs.existsSync(COOLDOWN_FILE)) {
        const cooldownUntil = parseInt(fs.readFileSync(COOLDOWN_FILE, 'utf8')) || 0;
        const now = Date.now();
        if (now < cooldownUntil) {
          const waitTime = cooldownUntil - now;
          console.warn(`[CJ API Queue] Global 429 Cooldown active. Pausing for ${Math.round(waitTime/1000)}s...`);
          await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000)));
          attempts = 0; 
          continue; 
        } else {
          try { fs.unlinkSync(COOLDOWN_FILE); } catch {}
        }
      }
    } catch {}

    // 2. Try to acquire filesystem lock
    try {
      fs.mkdirSync(LOCK_DIR);
      lockAcquired = true;
    } catch (e) {
      // 3. Check for stale locks (older than 30s)
      try {
        const stats = fs.statSync(LOCK_DIR);
        if (Date.now() - stats.mtimeMs > 30000) {
          try { fs.rmdirSync(LOCK_DIR); } catch {}
          continue;
        }
      } catch {}
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    }
  }

  try {
    let lastAt = 0;
    try {
      if (fs.existsSync(TS_FILE)) {
        lastAt = parseInt(fs.readFileSync(TS_FILE, 'utf8')) || 0;
      }
    } catch {}

    const now = Date.now();
    const wait = Math.max(0, lastAt + MIN_INTERVAL_MS - now);
    
    if (wait > 0) {
      console.log(`[CJ API Queue] Waiting ${wait}ms for slot... (Last: ${new Date(lastAt).toLocaleTimeString()})`);
      await new Promise(resolve => setTimeout(resolve, wait));
    }
    
    try {
      const finalTs = Date.now();
      fs.writeFileSync(TS_FILE, finalTs.toString());
      // Add a small random jitter to the end of the slot to prevent exact synchronization
      const jitter = Math.floor(Math.random() * 500);
      if (jitter > 0) await new Promise(resolve => setTimeout(resolve, jitter));
      console.log(`[CJ API Queue] Slot acquired at ${new Date(finalTs).toLocaleTimeString()}`);
    } catch {}
  } finally {
    try {
      if (lockAcquired) fs.rmdirSync(LOCK_DIR);
    } catch {}
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


// ── Config ────────────────────────────────────────────────────────────────
export const BASE_URL = process.env.CJ_API_BASE_URL || 'https://api.cjdropshipping.com';
const API_KEY = process.env.CJ_API_KEY;

// ── Token cache ───────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
let cachedRefreshToken: string | null = null;
let refreshTokenExpiry: number | null = null;
let loginPromise: Promise<string> | null = null;


export async function getAccessTokenServer(): Promise<string> {
  if (loginPromise) return loginPromise;
  
  loginPromise = (async () => {
    // 1. Check in-memory cache
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      return cachedToken;
    }

    // 2. Check DB cache
    try {
      const { prisma } = await import('@/lib/db');
      const settings = await prisma.storeSetting.findMany({
        where: {
          key: {
            in: ['CJ_ACCESS_TOKEN', 'CJ_TOKEN_EXPIRY', 'CJ_REFRESH_TOKEN', 'CJ_REFRESH_TOKEN_EXPIRY']
          }
        }
      });

      const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
      
      const dbToken = settingsMap['CJ_ACCESS_TOKEN'];
      const dbExpiry = settingsMap['CJ_TOKEN_EXPIRY'];
      const dbRefreshToken = settingsMap['CJ_REFRESH_TOKEN'];
      const dbRefreshExpiry = settingsMap['CJ_REFRESH_TOKEN_EXPIRY'];

      if (dbToken && dbExpiry && Date.now() < parseInt(dbExpiry)) {
        cachedToken = dbToken;
        tokenExpiry = parseInt(dbExpiry);
        cachedRefreshToken = dbRefreshToken || null;
        refreshTokenExpiry = dbRefreshExpiry ? parseInt(dbRefreshExpiry) : null;
        return cachedToken;
      }

      // If access token expired but refresh token is still valid, try refreshing
      if (dbRefreshToken && dbRefreshExpiry && Date.now() < parseInt(dbRefreshExpiry)) {
        console.log('[CJ API] Access token expired, attempting refresh with refresh token...');
        try {
          return await refreshAccessTokenServer(dbRefreshToken);
        } catch (e) {
          console.warn('[CJ API] Refresh token failed, falling back to full login.', e);
        }
      }
    } catch (e) {
      console.error('[Token DB Load Error]:', e);
    }

    // 3. Fallback to full login (getAccessToken)
    const url = `${BASE_URL}/v1/authentication/getAccessToken`;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await waitForSlot();
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: API_KEY }),
        });
        const data: CJResponse<{ 
          accessToken: string; 
          accessTokenExpiryDate: string;
          refreshToken: string;
          refreshTokenExpiryDate: string;
        }> = await response.json();
        
        if (!data.success && !data.result) {
          console.error('[CJ API Auth Error]:', {
            code: data.code,
            message: data.message,
            requestId: data.requestId
          });

          // 1. Handle QPS Limit (1600100 or 1600200)
          if (data.code === 1600100 || data.code === 1600200 || data.message?.includes('QPS limit')) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
            continue;
          }

          // 2. Handle Wrong API Key (1600005) - Try Legacy Fallback
          if (data.code === 1600005 && API_KEY?.includes('@')) {
            const parts = API_KEY.split('@');
            const password = parts.pop();
            const email = parts.join('@');
            
            // If the email part is "CJXXXXX@api", it's probably not a real email.
            // Try fallback with the actual email if we can guess it, or just try splitting.
            const targetEmail = email.includes('@') && !email.endsWith('@api') ? email : 'cristoperzonggonau@gmail.com';

            if (targetEmail && password) {
               console.log(`[CJ API] API Key rejected. Trying legacy auth fallback with email: ${targetEmail}`);
               await waitForSlot();
               const legacyResponse = await fetch(url, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ email: targetEmail, password }),
               });
               const legacyData = await legacyResponse.json();
               if (legacyData.success || legacyData.result) {
                 data.data = legacyData.data;
                 data.success = true;
                 data.result = true;
               } else {
                 console.error('[CJ API Legacy Auth Failed]:', legacyData.message);
                 if (legacyData.code === 1600200 || legacyData.message?.includes('QPS')) {
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 3000 * retryCount));
                    continue;
                 }
                 throw new Error(legacyData.message || 'Auth failed');
               }
            } else {
              throw new Error(data.message || 'Auth failed');
            }
          } else {
            throw new Error(data.message || 'Auth failed');
          }
        }

        if (data.success || data.result) {
          const expiryDate = new Date(data.data.accessTokenExpiryDate).getTime();
          const refreshExpiryDate = new Date(data.data.refreshTokenExpiryDate).getTime();

          cachedToken = data.data.accessToken;
          tokenExpiry = expiryDate;
          cachedRefreshToken = data.data.refreshToken;
          refreshTokenExpiry = refreshExpiryDate;

          // Persist to DB
          try {
            const { prisma } = await import('@/lib/db');
            const updates = [
              { key: 'CJ_ACCESS_TOKEN', value: cachedToken },
              { key: 'CJ_TOKEN_EXPIRY', value: tokenExpiry.toString() },
              { key: 'CJ_REFRESH_TOKEN', value: cachedRefreshToken },
              { key: 'CJ_REFRESH_TOKEN_EXPIRY', value: refreshTokenExpiry.toString() }
            ];

            for (const item of updates) {
              await prisma.storeSetting.upsert({
                where: { key: item.key },
                update: { value: item.value },
                create: { key: item.key, value: item.value }
              });
            }
          } catch (e) {
            console.error('[Token DB Save Error]:', e);
          }
          return cachedToken!;
        }
      } catch (err: any) {
        if (retryCount >= maxRetries) throw err;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error('Failed to get CJ access token after retries');
  })().finally(() => {
    loginPromise = null;
  });

  return loginPromise;
}

export async function refreshAccessTokenServer(refreshToken: string): Promise<string> {
  const url = `${BASE_URL}/v1/authentication/refreshAccessToken`;
  
  await waitForSlot();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  
  const data: CJResponse<{ 
    accessToken: string; 
    accessTokenExpiryDate: string;
    refreshToken: string;
    refreshTokenExpiryDate: string;
  }> = await response.json();

  if (!data.success && !data.result) {
    throw new Error(data.message || 'Refresh token failed');
  }

  const expiryDate = new Date(data.data.accessTokenExpiryDate).getTime();
  const refreshExpiryDate = new Date(data.data.refreshTokenExpiryDate).getTime();

  cachedToken = data.data.accessToken;
  tokenExpiry = expiryDate;
  cachedRefreshToken = data.data.refreshToken;
  refreshTokenExpiry = refreshExpiryDate;

  // Persist to DB
  try {
    const { prisma } = await import('@/lib/db');
    const updates = [
      { key: 'CJ_ACCESS_TOKEN', value: cachedToken },
      { key: 'CJ_TOKEN_EXPIRY', value: tokenExpiry.toString() },
      { key: 'CJ_REFRESH_TOKEN', value: cachedRefreshToken },
      { key: 'CJ_REFRESH_TOKEN_EXPIRY', value: refreshTokenExpiry.toString() }
    ];

    for (const item of updates) {
      await prisma.storeSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value }
      });
    }
  } catch (e) {
    console.error('[Token DB Save Error]:', e);
  }

  return cachedToken!;
}

export async function logoutTokenServer(): Promise<boolean> {
  const token = await getAccessTokenServer();
  const url = `${BASE_URL}/v1/authentication/logout`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'CJ-Access-Token': token
    }
  });
  
  const data: CJResponse<boolean> = await response.json();
  
  if (data.success || data.result) {
    // Clear local cache
    cachedToken = null;
    tokenExpiry = null;
    cachedRefreshToken = null;
    refreshTokenExpiry = null;
    
    // Clear DB cache
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.storeSetting.deleteMany({
        where: { key: { in: ['CJ_ACCESS_TOKEN', 'CJ_TOKEN_EXPIRY', 'CJ_REFRESH_TOKEN', 'CJ_REFRESH_TOKEN_EXPIRY'] } }
      });
    } catch (e) {
      console.error('[Token DB Clear Error]:', e);
    }
    return true;
  }
  
  return false;
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
  const cacheKey = `cj_${endpoint}_${JSON.stringify(options.body || '')}`.replace(/[^a-z0-9]/gi, '_').substring(0, 200);
  
  if (isGet) {
    // 1. Try In-memory Cache
    const memCached = getCache(cacheKey);
    if (memCached) return memCached;

    // 2. Try Filesystem Cache (30 min TTL)
    try {
      const fs = require('fs');
      const path = require('path');
      const CACHE_DIR = path.join(process.cwd(), '.cj_cache');
      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
      
      const cacheFile = path.join(CACHE_DIR, cacheKey + '.json');
      if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        if (Date.now() - stats.mtimeMs < 1000 * 60 * 30) {
          const content = fs.readFileSync(cacheFile, 'utf8');
          return JSON.parse(content);
        }
      }
    } catch {}
  }

  // Deduplication: if a request for the same endpoint is already in flight, wait for it
  const dedupKey = `cj_flight_${endpoint}_${JSON.stringify(options.body || '')}`;
  if (pendingRequests.has(dedupKey)) {
    return pendingRequests.get(dedupKey)!;
  }

  const fetchPromise = (async () => {
    let retryCount = 0;
    const maxRetries = 5;

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

      if (data.success || data.result) {
        console.log(`[CJ API] Request Success: ${endpoint}`);
        
        // Save to Filesystem Cache
        if (isGet) {
          try {
            const fs = require('fs');
            const path = require('path');
            const CACHE_DIR = path.join(process.cwd(), '.cj_cache');
            if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);
            fs.writeFileSync(path.join(CACHE_DIR, cacheKey + '.json'), JSON.stringify(data));
            setCache(cacheKey, data); // Also set in-memory
          } catch {}
        }
      }

      // Handle Invalid/Expired Token (Retry once with fresh token)
      if (!data.success && !data.result && (data.code === 1600101 || data.code === 1600102 || data.message?.toLowerCase().includes('access token'))) {
        if (retryCount === 0) {
          console.warn(`[CJ API] Token invalid or expired. Clearing cache and retrying...`);
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
      if (!data.success && !data.result && (data.code === 1600100 || data.code === 1600200 || data.message?.includes('QPS limit'))) {
        retryCount++;
        
        // Set Global 429 Cooldown for all processes (15 seconds)
        try {
          const fs = require('fs');
          const path = require('path');
          fs.writeFileSync(path.join(process.cwd(), '.cj_429_cooldown'), (Date.now() + 15000).toString());
        } catch {}

        // Exponential backoff
        const baseWait = Math.pow(2, retryCount) * 5000;
        const jitter = Math.random() * 2000;
        const wait = baseWait + jitter;
        
        console.error(`[CJ API] Rate Limited! Set global 15s cooldown. Retrying this request in ${Math.round(wait/1000)}s...`);
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
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  try {
    const result = await fetchPromise;
    if (isGet && (result.success || result.result)) {
       setCache(cacheKey, result);
    }
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}

import { 
  CJProduct, 
  CJVariant, 
  CJProductDetail, 
  CJResponse, 
  parseProductName, 
  parseProductImage, 
  slugify 
} from './cj-helpers';

export type { CJProduct, CJVariant, CJProductDetail, CJResponse };
export { parseProductName, parseProductImage, slugify };

// ── Products ──────────────────────────────────────────────────────────────
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
    productFlag?: number; // 0-Trending, 1-New, 2-Video, 3-Slow
  } = {}
): Promise<CJResponse<{ list: CJProduct[]; total: number }>> {
  // Use listV2 for better performance and more filters as per documentation
  const query = new URLSearchParams({
    page: (params.pageNum || 1).toString(),
    size: (params.pageSize || 20).toString(),
  });

  if (params.keyWord) query.set('keyWord', params.keyWord);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.countryCode) query.set('countryCode', params.countryCode);
  if (params.minPrice != null) query.set('startSellPrice', params.minPrice.toString());
  if (params.maxPrice != null) query.set('endSellPrice', params.maxPrice.toString());
  
  // Map searchType=2 (trending) to productFlag=0 if not explicitly provided
  const flag = params.productFlag ?? (params.searchType === 2 ? 0 : undefined);
  if (flag !== undefined) query.set('productFlag', flag.toString());

  const res = await cjFetch<any>(`/v1/product/listV2?${query.toString()}`);
  
  if (res.success && res.data && res.data.content) {
    // V2 returns content array with productList inside
    const content = res.data.content[0];
    const rawList = content?.productList || [];
    
    // Map V2 product fields to our CJProduct interface
    const mappedList: CJProduct[] = rawList.map((p: any) => ({
      pid: p.id || p.pid, // V2 uses id, V1 used pid
      productName: p.nameEn || p.productNameEn,
      productNameEn: p.nameEn || p.productNameEn,
      bigImage: p.bigImage || p.productImage,
      productImage: p.bigImage || p.productImage,
      sellPrice: p.sellPrice || p.nowPrice,
      categoryName: p.threeCategoryName || '',
      categoryId: p.categoryId || '',
      productSku: p.sku || p.productSku,
      productUnit: p.productUnit || 'PCS',
      productWeight: p.productWeight || 0,
    }));

    return {
      ...res,
      data: {
        list: mappedList,
        total: res.data.totalRecords || mappedList.length
      }
    };
  }

  // Fallback to V1 if V2 fails or returns no data (sometimes useful for specific category searches)
  if (!res.success && !params.keyWord) {
    const v1Query = new URLSearchParams({
      pageNum: (params.pageNum || 1).toString(),
      pageSize: (params.pageSize || 20).toString(),
    });
    if (params.categoryId) v1Query.set('categoryId', params.categoryId);
    return cjFetch(`/v1/product/list?${v1Query.toString()}`);
  }

  return {
    ...res,
    data: { list: [], total: 0 }
  };
}

export async function getProductDetails(id: string): Promise<CJResponse<CJProductDetail>> {
  // 1. Try local DB Cache first (24h TTL)
  try {
    const { prisma } = await import('@/lib/db');
    const localProduct = await prisma.product.findUnique({
      where: { cjId: id },
      include: { variants: true }
    });

    if (localProduct && (Date.now() - localProduct.updatedAt.getTime() < 1000 * 60 * 60 * 24)) {
      // Map back to CJ format
      const mappedData: any = {
        pid: localProduct.cjId,
        productName: localProduct.name,
        productNameEn: localProduct.name,
        description: localProduct.description,
        productImage: localProduct.images[0],
        bigImage: localProduct.images[0],
        productImageSet: localProduct.images,
        variants: localProduct.variants.map(v => ({
          vid: v.cjId,
          variantNameEn: v.color || v.size || 'Default',
          variantSellPrice: v.baseCost,
          variantSku: v.sku,
          variantWeight: v.weight,
          inventory: v.inventory,
          variantImage: v.image
        }))
      };
      return { success: true, result: true, message: 'Success (from Cache)', code: 200, data: mappedData, requestId: 'cache' };
    }
  } catch (e) {
    console.warn('[Cache Check Error]:', e);
  }

  // 2. Fetch from API
  const res = await cjFetch<CJProductDetail>(`/v1/product/query?pid=${id}`);
  
  // 3. Update DB Cache on success
  if (res.success && res.data) {
    try {
      const { prisma } = await import('@/lib/db');
      const p = res.data;
      
      await prisma.product.upsert({
        where: { cjId: p.pid },
        update: {
          name: p.productNameEn || p.productName,
          description: p.description,
          images: p.productImageSet || [p.productImage],
          updatedAt: new Date(),
          variants: {
            deleteMany: {},
            create: p.variants.map(v => ({
              cjId: v.vid,
              sku: v.variantSku,
              color: v.variantNameEn,
              weight: v.variantWeight || 0,
              baseCost: v.variantSellPrice,
              sellingPrice: v.variantSellPrice, // Markup happens in UI
              inventory: v.inventory || 0,
              image: v.variantImage
            }))
          }
        },
        create: {
          cjId: p.pid,
          name: p.productNameEn || p.productName,
          description: p.description,
          images: p.productImageSet || [p.productImage],
          variants: {
            create: p.variants.map(v => ({
              cjId: v.vid,
              sku: v.variantSku,
              color: v.variantNameEn,
              weight: v.variantWeight || 0,
              baseCost: v.variantSellPrice,
              sellingPrice: v.variantSellPrice,
              inventory: v.inventory || 0,
              image: v.variantImage
            }))
          }
        }
      });
    } catch (e) {
      console.warn('[Cache Update Error]:', e);
    }
  }

  if (!res.success && id.length > 5) {
    const resSku = await cjFetch<CJProductDetail>(`/v1/product/query?productSku=${id}`);
    if (resSku.success) return resSku;
  }

  // 4. Final Fallback: If API failed, try to return Stale DB data even if it's older than 24h
  if (!res.success) {
    try {
      const { prisma } = await import('@/lib/db');
      const staleProduct = await prisma.product.findUnique({
        where: { cjId: id },
        include: { variants: true }
      });
      if (staleProduct) {
        console.log(`[CJ API Cache] API Failed for ${id}, returning stale DB data.`);
        const mappedData: any = {
           pid: staleProduct.cjId,
           productName: staleProduct.name,
           productNameEn: staleProduct.name,
           description: staleProduct.description,
           productImage: staleProduct.images[0],
           bigImage: staleProduct.images[0],
           productImageSet: staleProduct.images,
           variants: staleProduct.variants.map(v => ({
             vid: v.cjId,
             variantNameEn: v.color || v.size || 'Default',
             variantSellPrice: v.baseCost,
             variantSku: v.sku,
             variantWeight: v.weight,
             inventory: v.inventory,
             variantImage: v.image
           }))
        };
        return { success: true, result: true, message: 'Success (Stale Cache)', code: 200, data: mappedData, requestId: 'stale' };
      }
    } catch {}
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

export async function getGlobalWarehouses() {
  return cjFetch<any>('/v1/product/globalWarehouseList');
}

/**
 * Bulk Sync Category Products to Database
 * Respects QPS limits by sequential processing
 */
export async function syncCategoryProducts(categoryId: string, limit: number = 100) {
  if (activeSyncJob.status === 'RUNNING') {
    throw new Error('A sync job is already running');
  }

  activeSyncJob = {
    categoryId,
    total: 0,
    processed: 0,
    status: 'RUNNING',
    message: 'Initializing sync...'
  };

  try {
    const allPids: string[] = [];
    const pageSize = 100;
    const pagesNeeded = Math.ceil(limit / pageSize);

    // 1. Fetch all PIDs first (respecting QPS between list calls)
    for (let p = 1; p <= pagesNeeded; p++) {
      activeSyncJob.message = `Fetching product list page ${p}/${pagesNeeded}...`;
      const listRes = await getProducts({ 
        categoryId, 
        pageSize: Math.min(pageSize, limit - allPids.length),
        pageNum: p 
      });

      if (listRes.success && listRes.data && listRes.data.list) {
        const pids = listRes.data.list.map((item: any) => item.pid);
        allPids.push(...pids);
      }
      
      if (allPids.length >= limit) break;
    }

    if (allPids.length === 0) {
      throw new Error('No products found in this category');
    }

    activeSyncJob.total = allPids.length;
    activeSyncJob.message = `Found ${allPids.total} products. Starting deep sync...`;

    // 2. Start sequential background sync
    (async () => {
      for (const pid of allPids) {
        try {
          activeSyncJob.message = `Deep Syncing ${activeSyncJob.processed + 1}/${activeSyncJob.total}: ${pid}`;
          await getProductDetails(pid); 
          activeSyncJob.processed++;
        } catch (err: any) {
          console.error(`[Bulk Sync Error] ${pid}:`, err.message);
        }
      }
      activeSyncJob.status = 'COMPLETED';
      activeSyncJob.message = `Finished! Synced ${activeSyncJob.processed} products to your database.`;
    })();

    return { success: true, message: 'Bulk sync started', total: allPids.length };

  } catch (error: any) {
    activeSyncJob.status = 'FAILED';
    activeSyncJob.message = error.message;
    return { success: false, message: error.message };
  }
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
