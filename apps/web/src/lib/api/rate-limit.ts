import { error } from './responses';
import { NextRequest, NextResponse } from 'next/server';

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

/* -------------------------------------------------------------------------- */
/*  Endpoint-specific presets                                                   */
/* -------------------------------------------------------------------------- */

export const RATE_LIMIT_PRESETS = {
  /** Auth endpoints: login, register, password reset (5 req / 60s) */
  auth: { windowMs: 60_000, max: 5, keyPrefix: 'auth' } as RateLimitOptions,
  /** Standard API endpoints (60 req / 60s) */
  api: { windowMs: 60_000, max: 60, keyPrefix: 'api' } as RateLimitOptions,
  /** File upload endpoints (10 req / 60s) */
  upload: { windowMs: 60_000, max: 10, keyPrefix: 'upload' } as RateLimitOptions,
  /** Public form endpoints — magic links, signing (20 req / 60s) */
  publicForm: { windowMs: 60_000, max: 20, keyPrefix: 'public-form' } as RateLimitOptions,
  /** Admin API endpoints (120 req / 60s) */
  admin: { windowMs: 60_000, max: 120, keyPrefix: 'admin' } as RateLimitOptions,
  /** Sensitive operations — token verify, password change (3 req / 60s) */
  sensitive: { windowMs: 60_000, max: 3, keyPrefix: 'sensitive' } as RateLimitOptions,
} as const;

/* -------------------------------------------------------------------------- */
/*  IP extraction                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Extract the client IP from a Next.js request.
 * Checks standard proxy headers, then falls back to 'unknown'.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  // X-Forwarded-For may contain comma-separated list; take the first (client) IP
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

/* -------------------------------------------------------------------------- */
/*  Core rate limiter                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Rate limit by user ID.
 * Original function — unchanged API for backward compatibility.
 */
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

/* -------------------------------------------------------------------------- */
/*  IP-based rate limiter                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Rate limit by client IP address.
 * Useful for public endpoints where no user ID is available.
 */
export function rateLimitByIp(
  request: NextRequest | Request,
  opts: RateLimitOptions = {}
): { limited: boolean; response?: NextResponse; ip: string } {
  const ip = getClientIp(request);
  const result = rateLimit(`ip:${ip}`, opts);
  return { ...result, ip };
}

/* -------------------------------------------------------------------------- */
/*  Strict rate limiter                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Strict rate limiter for sensitive endpoints.
 * Uses both user ID and IP for double protection.
 * Defaults to very low limits (3 req / 60s).
 */
export function strictRateLimit(
  request: NextRequest | Request,
  userId?: string,
  opts: RateLimitOptions = RATE_LIMIT_PRESETS.sensitive
): { limited: boolean; response?: NextResponse; ip: string } {
  const ip = getClientIp(request);

  // Check IP-based limit
  const ipResult = rateLimit(`strict-ip:${ip}`, opts);
  if (ipResult.limited) return { ...ipResult, ip };

  // Also check user-based limit if user ID is available
  if (userId) {
    const userResult = rateLimit(`strict-user:${userId}`, opts);
    if (userResult.limited) return { ...userResult, ip };
  }

  return { limited: false, ip };
}
