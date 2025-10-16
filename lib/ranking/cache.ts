interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  updatedAt: number;
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const cache = new Map<string, CacheEntry<unknown>>();
const pendingResolutions = new Map<string, Promise<unknown>>();

export type CacheReadResult<T> = {
  data: T;
  updatedAt: number;
} | null;

export const RANKING_CACHE_KEY = "ranking";
export const RANKING_CACHE_TTL_MS = FIFTEEN_MINUTES_MS;

export function readCache<T>(key: string, now: number = Date.now()): CacheReadResult<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }

  return {
    data: entry.data,
    updatedAt: entry.updatedAt,
  };
}

export function writeCache<T>(key: string, data: T, ttlMs: number, now: number = Date.now()): void {
  const expiresAt = now + ttlMs;
  cache.set(key, {
    data,
    expiresAt,
    updatedAt: now,
  });
}
export function clearAllCaches(): void {
  cache.clear();
  pendingResolutions.clear();
}

export async function fetchWithCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = readCache<T>(key);
  if (cached) {
    return cached.data;
  }

  const pending = pendingResolutions.get(key) as Promise<T> | undefined;
  if (pending) {
    return pending;
  }

  const resolution = (async () => {
    try {
      const data = await loader();
      writeCache(key, data, ttlMs);
      return data;
    } finally {
      pendingResolutions.delete(key);
    }
  })();

  pendingResolutions.set(key, resolution);
  return resolution;
}
