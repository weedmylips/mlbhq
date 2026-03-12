import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export function getCached(key) {
  return cache.get(key);
}

export function setCached(key, value, ttl) {
  cache.set(key, value, ttl || 60);
}

export default cache;
