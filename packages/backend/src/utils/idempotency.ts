/**
 * In-memory idempotency cache for POST /items.
 *
 * Stores (idempotency-key → cached response) with a TTL so that safe retries
 * on duplicate POST requests return the original response instead of re-executing.
 *
 * In production, replace this Map with a Redis client — the interface is identical.
 *
 * TTL: 24 hours (matching industry standard for idempotency windows).
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  response: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

/**
 * Retrieve a cached response for the given idempotency key.
 * Returns `null` if the key is not found or has expired.
 */
export function getIdempotencyCache(key: string): unknown | null {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.response;
}

/**
 * Store a response under the given idempotency key with a 24-hour TTL.
 */
export function setIdempotencyCache(key: string, response: unknown): void {
  store.set(key, {
    response,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Evict all expired entries. Call this periodically (e.g. every hour)
 * to prevent unbounded memory growth in long-running processes.
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}

// Schedule automatic cleanup every hour
setInterval(cleanupExpiredCache, 60 * 60 * 1000).unref();
