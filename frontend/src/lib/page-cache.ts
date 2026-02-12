type CacheEntry<T> = {
  timestamp: number;
  data: T;
};

const pageCache = new Map<string, CacheEntry<unknown>>();

export const getCachedPageData = <T>(key: string, ttlMs: number): T | null => {
  const entry = pageCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) return null;
  return entry.data;
};

export const setCachedPageData = <T>(key: string, data: T) => {
  pageCache.set(key, { timestamp: Date.now(), data });
};

export const clearCachedPageData = (key: string) => {
  pageCache.delete(key);
};

