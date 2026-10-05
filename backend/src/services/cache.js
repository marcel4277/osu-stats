// Small in-memory cache for osu! API results.
//
// It stores the promise rather than the finished value, so requests that
// arrive while a fetch is still running share that fetch instead of each
// calling the osu! API. Failed fetches are dropped so the next request retries.
export function createCache({ ttlMs, maxEntries }) {
  const entries = new Map(); // key -> { promise, expiresAt }

  return function cached(key, load) {
    const entry = entries.get(key);
    if (entry && entry.expiresAt > Date.now()) return entry.promise;
    entries.delete(key);

    // Map keeps insertion order, so the first key is the oldest
    if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);

    const promise = load();
    entries.set(key, { promise, expiresAt: Date.now() + ttlMs });
    promise.catch(() => {
      if (entries.get(key)?.promise === promise) entries.delete(key);
    });
    return promise;
  };
}
