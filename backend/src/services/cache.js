import { getJson, setJson } from './store.js';

// Cache for osu! API results, in two layers:
//   memory  fast, and lets requests that arrive while a fetch is still running
//           share that fetch instead of each calling osu!;
//   Redis   survives the server restarting or going to sleep.
//
// Every value is kept as { data, fetchedAt }, so the age shown to the visitor
// is the age of the osu! data, not of the copy.
//
// `refresh` asks for new data from osu!, but data younger than
// `minRefreshMs` is returned as it is, so the refresh button can't be used to
// spend the osu! request budget. Failed fetches are never kept, so the next
// request tries again.
export function createCache({ name, ttlMs, minRefreshMs, maxEntries }) {
  const entries = new Map(); // key -> { promise, fetchedAt (null while loading) }

  function usable(entry, refresh) {
    if (!entry) return false;
    if (entry.fetchedAt == null) return true;
    const age = Date.now() - entry.fetchedAt;
    return age < (refresh ? minRefreshMs : ttlMs);
  }

  return function cached(key, fetchFresh, { refresh = false } = {}) {
    const entry = entries.get(key);
    if (usable(entry, refresh)) return entry.promise;
    entries.delete(key);

    // Map keeps insertion order, so the first key is the oldest
    if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);

    const storeKey = `${name}:${key}`;
    const next = { fetchedAt: null };
    next.promise = (async () => {
      if (!refresh) {
        const stored = await getJson(storeKey);
        if (stored && Date.now() - stored.fetchedAt < ttlMs) return stored;
      }
      const value = { data: await fetchFresh(), fetchedAt: Date.now() };
      setJson(storeKey, value, ttlMs);
      return value;
    })();
    next.promise.then(
      value => { next.fetchedAt = value.fetchedAt; },
      () => { if (entries.get(key) === next) entries.delete(key); },
    );
    entries.set(key, next);
    return next.promise;
  };
}
