import { error } from './responses';
import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 min
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

export function rateLimit(
  userId: string,
  opts: RateLimitOptions = {}
): { limited: boolean; response?: NextResponse } {
  const { windowMs = 60_000, max = 100, keyPrefix = 'api' } = opts;
  const key = `${keyPrefix}:${userId}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  const resetSec = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > max) {
    const resp = error('Too many requests', 429);
    resp.headers.set('X-RateLimit-Limit', String(max));
    resp.headers.set('X-RateLimit-Remaining', '0');
    resp.headers.set('X-RateLimit-Reset', String(resetSec));
    resp.headers.set('Retry-After', String(resetSec));
    return { limited: true, response: resp };
  }

  return { limited: false };
}
