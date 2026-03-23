type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const cache = new Map<string, CacheEntry>();
const MAX_KEYS = 500;

function purgeExpired() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function ensureCapacity() {
  if (cache.size < MAX_KEYS) {
    return;
  }
  // Evict oldest inserted key when full.
  const firstKey = cache.keys().next().value as string | undefined;
  if (firstKey) {
    cache.delete(firstKey);
  }
}

export function getCachedResponse<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return entry.value as T;
}

export function setCachedResponse(key: string, value: unknown, ttlMs: number): void {
  purgeExpired();
  ensureCapacity();
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateCacheByPrefixes(prefixes: string[]): void {
  if (prefixes.length === 0) {
    return;
  }
  for (const key of cache.keys()) {
    if (prefixes.some(prefix => key.startsWith(prefix))) {
      cache.delete(key);
    }
  }
}
