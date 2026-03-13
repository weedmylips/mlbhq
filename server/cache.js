import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
const pending = new Map();

export function getCached(key) {
  return cache.get(key);
}

export function setCached(key, value, ttl) {
  cache.set(key, value, ttl || 60);
}

export async function getOrFetch(key, fetchFn, ttlOrFn) {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  if (pending.has(key)) return pending.get(key);

  const promise = fetchFn()
    .then(result => {
      const ttl = typeof ttlOrFn === 'function' ? ttlOrFn(result) : (ttlOrFn || 60);
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

export default cache;
