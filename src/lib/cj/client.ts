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

export async function getCache(_key: string) {
  // Redis disabled — langsung panggil API
  return null;
}

export async function setCache(_key: string, _data: any, _ttl?: number) {
  // Redis disabled
}

// ── Config ────────────────────────────────────────────────────────────────
export const BASE_URL = process.env.CJ_API_BASE_URL || 'https://api.cjdropshipping.com';
const API_KEY = process.env.CJ_API_KEY;

// ── Global Error Codes ───────────────────────────────────────────────────────
const GLOBAL_ERROR_CODES: Record<number | string, string> = {
  1600100: "QPS Limit Exceeded (Too many requests)",
  1600101: "Access Token Invalid or Expired",
  1600102: "Refresh Token Invalid or Expired",
  1000003: "Token verification failed",
  1000010: "Access frequency limit reached",
  1000012: "Required parameter missing or invalid",
  7000003: "Insufficient CJ Balance",
  8000000: "System Error"
};

function formatCJError(data: any): string {
  const code = data.code;
  const knownMsg = GLOBAL_ERROR_CODES[code];
  const apiMsg = data.message || 'Unknown error';
  return knownMsg ? `[CJ Error ${code}] ${knownMsg} - ${apiMsg}` : `[CJ Error ${code || 'N/A'}] ${apiMsg}`;
}

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

const AUTH_BASE_URL = process.env.CJ_AUTH_BASE_URL || 'https://developers.cjdropshipping.com';

function parseCJDate(dateStr: string): number {
  return new Date(dateStr).getTime();
}

interface CJTokenResponse {
  openId?: number;
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
  createDate?: string;
}

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
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken!;
  }

  let prisma: any;
  try {
    const db = await import('@/lib/db');
    prisma = db.prisma;
  } catch {}

  if (prisma) {
    try {
      const [dbToken, dbExpiry] = await Promise.all([
        prisma.storeSetting.findUnique({ where: { key: 'CJ_ACCESS_TOKEN' } }),
        prisma.storeSetting.findUnique({ where: { key: 'CJ_TOKEN_EXPIRY' } }),
      ]);

      if (dbToken && dbExpiry && Date.now() < parseInt(dbExpiry.value)) {
        cachedToken = dbToken.value;
        tokenExpiry = parseInt(dbExpiry.value);
        return cachedToken!;
      }
    } catch {}
  }

  // Get new token from CJ
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
        if (data.message?.includes('QPS limit') || data.code === 1600100 || data.code === 1000010) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          continue;
        }
        throw new Error(formatCJError(data));
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
  const isProductEndpoint = endpoint.includes('/product/list') || endpoint.includes('/product/query');
  const cacheKey = `cj_${endpoint}_${JSON.stringify(options.body || '')}`;
  if (isGet && isProductEndpoint) {
    const cached = await getCache(cacheKey);
    if (cached) return cached;
  }

  const cleanEndpoint = endpoint.replace(/^\/api2\.0/, '');

  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

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

      if (!data.success && !data.result && (data.code === 1600101 || data.code === 1600102 || data.code === 1000003 || data.message?.toLowerCase().includes('access token'))) {
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

      if (!data.success && !data.result && (data.code === 1600100 || data.code === 1000010 || data.message?.includes('QPS limit'))) {
        retryCount++;
        const baseWait = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        const wait = baseWait + jitter;
        
        console.warn(`[CJ API] QPS Limit on ${endpoint}. Retrying in ${Math.round(wait)}ms (Attempt ${retryCount}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }

      if (isGet && isProductEndpoint && (data.success || data.result)) {
        await setCache(cacheKey, data);
      }

      if (!data.success && !data.result && (data.code === 1000012 || data.code === '1000012')) {
         console.error(`🚨 [CJ API Param Error]: ${formatCJError(data)} on ${endpoint} with params:`, options.body);
      }

      return data;
    } catch (err: any) {
      if (retryCount >= maxRetries) throw err;
      retryCount++;
      const wait = 2000 * retryCount;
      await new Promise(resolve => setTimeout(resolve, wait));
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error(`Failed to fetch from CJ after ${maxRetries} retries due to QPS limits or network errors`);
}
