const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 100;

// Map<cacheKey, { scores, complete, fetching, timestamp }>
const cache = new Map();

function evictOldest() {
  // Map preserves insertion order — first key is oldest
  const firstKey = cache.keys().next().value;
  cache.delete(firstKey);
}

export function getCacheEntry(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry;
}

export function setCacheEntry(key, scores, complete) {
  const existing = cache.get(key);

  if (!existing && cache.size >= MAX_ENTRIES) {
    evictOldest();
  }

  cache.set(key, {
    scores,
    complete,
    fetching: existing?.fetching ?? false,
    timestamp: existing?.timestamp ?? Date.now(),
  });
}

// Atomically marks a key as fetching. Returns true if the lock was acquired,
// false if a fetch is already in progress (prevents duplicate background jobs).
export function acquireFetchLock(key) {
  const entry = cache.get(key);
  if (!entry || entry.fetching) return false;
  entry.fetching = true;
  return true;
}

export function releaseFetchLock(key) {
  const entry = cache.get(key);
  if (entry) entry.fetching = false;
}

export function isFetching(key) {
  return cache.get(key)?.fetching ?? false;
}
