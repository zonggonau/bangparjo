/**
 * Cache — DISABLED. Semua data langsung dari database.
 */

export async function getAppCache<T>(_key: string): Promise<T | null> {
  return null;
}

export async function setAppCache(_key: string, _data: any, _ttl?: number) {
  // no-op
}

export async function invalidateAppCache(_key: string) {
  // no-op
}
