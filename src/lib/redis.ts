/**
 * Redis client — centralized caching for blog posts and AI content
 *
 * Uses ioredis with REDIS_URL from env.
 * Falls back to a no-op (in-memory Map) if Redis is unavailable.
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';

export let redis: Redis | null = null;
export let redisAvailable = false;

// In-memory fallback for when Redis is down
const memoryCache = new Map<string, { data: string; expiry: number }>();

function getMemoryCache(key: string): string | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

function setMemoryCache(key: string, data: string, ttlSeconds: number): void {
  memoryCache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
}

// Try to connect
if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('ready', () => { redisAvailable = true; });
    redis.on('error', (err) => {
      console.warn('[Redis] Connection error (fallback to memory cache):', err.message);
      redisAvailable = false;
    });
    redis.on('close', () => { redisAvailable = false; });
  } catch (err) {
    console.warn('[Redis] Failed to initialize (fallback to memory cache):', err);
    redisAvailable = false;
  }
}

const DEFAULT_TTL = 300; // 5 minutes default

/**
 * Get a cached value, or compute & store if not found
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<T> {
  // Try Redis first
  if (redis && redisAvailable) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      console.warn('[Redis] Get failed, trying memory cache:', err);
      redisAvailable = false;
    }
  }

  // Fallback: in-memory
  const memCached = getMemoryCache(key);
  if (memCached) {
    return JSON.parse(memCached) as T;
  }

  // Fetch fresh data
  const fresh = await fetcher();

  // Store to Redis
  if (redis && redisAvailable) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
    } catch (err) {
      console.warn('[Redis] Set failed:', err);
      redisAvailable = false;
    }
  }

  // Always store in memory fallback too
  setMemoryCache(key, JSON.stringify(fresh), ttlSeconds);

  return fresh;
}

/**
 * Invalidate a cache key (useful after creating/updating a blog post)
 */
export async function invalidateCache(key: string): Promise<void> {
  memoryCache.delete(key);
  if (redis && redisAvailable) {
    try {
      await redis.del(key);
    } catch {
      // ignore
    }
  }
}

/**
 * Invalidate all blog-related cache keys (pattern: blog:*)
 */
export async function invalidateBlogCache(): Promise<void> {
  // Clear memory cache keys starting with 'blog:'
  for (const key of memoryCache.keys()) {
    if (key.startsWith('blog:')) memoryCache.delete(key);
  }
  if (redis && redisAvailable) {
    try {
      const keys = await redis.keys('blog:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Disconnect Redis (graceful shutdown)
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    redis.disconnect();
    redis = null;
    redisAvailable = false;
  }
}
