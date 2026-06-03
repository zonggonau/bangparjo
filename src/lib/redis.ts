/**
 * Redis client — DISABLED. Semua data langsung dari database, tanpa cache.
 */

export let redis = null;
export let redisAvailable = false;

/**
 * getOrSet — langsung panggil fetcher, tanpa cache.
 */
export async function getOrSet<T>(
  _key: string,
  fetcher: () => Promise<T>,
  _ttlSeconds?: number,
): Promise<T> {
  return fetcher();
}

export async function invalidateCache(_key: string): Promise<void> {
  // no-op
}

export async function invalidateBlogCache(): Promise<void> {
  // no-op
}

export async function disconnectRedis(): Promise<void> {
  // no-op
}
