

export async function getAppCache<T>(key: string): Promise<T | null> {
  if (typeof window !== 'undefined') return null;
  try {
    const { redis: r } = await import('./redis');
    if (!r || r.status !== 'ready') return null;
    const data = await r.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('[Cache Get Error]:', e);
    return null;
  }
}

export async function setAppCache(key: string, data: any, ttl = 3600) {
  if (typeof window !== 'undefined') return;
  try {
    const { redis: r } = await import('./redis');
    if (!r || r.status !== 'ready') return;
    await r.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (e) {
    console.warn('[Cache Set Error]:', e);
  }
}

export async function invalidateAppCache(key: string) {
  if (typeof window !== 'undefined') return;
  try {
    const { redis: r } = await import('./redis');
    if (!r || r.status !== 'ready') return;
    await r.del(key);
  } catch (e) {
    console.warn('[Cache Invalidate Error]:', e);
  }
}
