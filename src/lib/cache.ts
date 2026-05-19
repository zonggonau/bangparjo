

export async function getAppCache<T>(key: string): Promise<T | null> {
  if (typeof window !== 'undefined') return null;
  try {
    const { redis } = await import('./redis');
    if (redis.status !== 'ready') return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('[Cache Get Error]:', e);
    return null;
  }
}

export async function setAppCache(key: string, data: any, ttl = 3600) {
  if (typeof window !== 'undefined') return;
  try {
    const { redis } = await import('./redis');
    if (redis.status !== 'ready') return;
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (e) {
    console.warn('[Cache Set Error]:', e);
  }
}

export async function invalidateAppCache(key: string) {
  if (typeof window !== 'undefined') return;
  try {
    const { redis } = await import('./redis');
    if (redis.status !== 'ready') return;
    await redis.del(key);
  } catch (e) {
    console.warn('[Cache Invalidate Error]:', e);
  }
}
