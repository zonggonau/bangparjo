// ── Simple In-Memory Rate Limiter ───────────────────────────────────────
// Uses a sliding window approach to limit requests per IP.
// Note: This is in-memory only — if you scale to multiple instances,
// replace with a Redis-based implementation.

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter(ts => now - ts < 60_000);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 5 * 60_000);

export interface RateLimitConfig {
  interval: number; // in seconds (default: 60)
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  interval: 60,
  maxRequests: 30,
};

/**
 * Check if a request should be rate-limited.
 * Returns { success: true } if allowed, or { success: false, retryAfter } if blocked.
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { success: true } | { success: false; retryAfter: number } {
  const now = Date.now();
  const windowMs = config.interval * 1000;

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter(ts => now - ts < windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { success: false, retryAfter };
  }

  entry.timestamps.push(now);
  return { success: true };
}

/**
 * Create a rate-limited API route handler wrapper.
 * Usage: export const { GET, POST } = withRateLimit({ maxRequests: 10 })(handlers);
 */
export function withRateLimit(config?: Partial<RateLimitConfig>) {
  const finalConfig: RateLimitConfig = { ...DEFAULT_CONFIG, ...config };

  return (handlers: Record<string, Function>) => {
    const wrapped: Record<string, Function> = {};
    
    for (const [method, handler] of Object.entries(handlers)) {
      wrapped[method] = async (req: Request, ...args: any[]) => {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || req.headers.get('x-real-ip')
          || '127.0.0.1';

        const result = checkRateLimit(ip, finalConfig);
        if (!result.success) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Too many requests. Retry after ${result.retryAfter}s`,
              retryAfter: result.retryAfter
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(result.retryAfter),
                'X-RateLimit-Limit': String(finalConfig.maxRequests),
                'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + result.retryAfter),
              },
            }
          );
        }

        return handler(req, ...args);
      };
    }

    return wrapped;
  };
}
