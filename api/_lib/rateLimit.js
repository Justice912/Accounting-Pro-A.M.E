// Lightweight in-memory sliding-window rate limiter.
//
// Serverless instances are short-lived, so this is a soft cap rather than a
// strong guarantee. It still blocks runaway clients and accidental loops.
//
// Usage:
//   import { rateLimit, clientIp } from './_lib/rateLimit.js';
//   if (!rateLimit(`extract:uid:${auth.uid}`, { max: 20, windowMs: 60_000 })) {
//     return res.status(429).json({ error: 'rate_limited' });
//   }

const buckets = new Map(); // key -> number[] (timestamps ms)
const MAX_KEYS = 5000;     // crude memory cap

export function rateLimit(key, { max, windowMs }) {
  const now = Date.now();
  const cutoff = now - windowMs;
  const arr = (buckets.get(key) || []).filter((t) => t > cutoff);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > MAX_KEYS) {
    // Evict the oldest bucket cheaply.
    const firstKey = buckets.keys().next().value;
    if (firstKey !== undefined) buckets.delete(firstKey);
  }
  return true;
}

export function clientIp(req) {
  const fwd =
    (typeof req.headers?.get === 'function'
      ? req.headers.get('x-forwarded-for')
      : req.headers?.['x-forwarded-for']) || '';
  const real =
    (typeof req.headers?.get === 'function'
      ? req.headers.get('x-real-ip')
      : req.headers?.['x-real-ip']) || '';
  return fwd.split(',')[0]?.trim() || real || 'unknown';
}
