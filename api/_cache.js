import NodeCache from 'node-cache';

export function createCache(stdTTL, checkperiod) {
  const cache = new NodeCache({ stdTTL, checkperiod });
  const pending = new Map();

  async function getOrFetch(key, fetchFn, ttlOrFn) {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    if (pending.has(key)) return pending.get(key);

    const promise = fetchFn()
      .then(result => {
        const ttl = typeof ttlOrFn === 'function' ? ttlOrFn(result) : (ttlOrFn ?? stdTTL);
        cache.set(key, result, ttl);
        pending.delete(key);
        return result;
      })
      .catch(err => {
        pending.delete(key);
        throw err;
      });

    pending.set(key, promise);
    return promise;
  }

  return { getOrFetch };
}
