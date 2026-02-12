import { Ratelimit } from '@upstash/ratelimit';
import { NextResponse } from 'next/server';
import { getRedis } from './redis';
import { rateLimit, type RateLimitOptions } from './rate-limit';
import { error } from './responses';

/* -------------------------------------------------------------------------- */
/*  Redis-backed rate limiting with graceful in-memory fallback               */
/* -------------------------------------------------------------------------- */

// Cache Ratelimit instances by key prefix to avoid re-creation
const ratelimitCache = new Map<string, Ratelimit>();

function getOrCreateRatelimit(keyPrefix: string, windowMs: number, max: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${keyPrefix}:${windowMs}:${max}`;
  let rl = ratelimitCache.get(cacheKey);
  if (rl) return rl;

  const windowSec = Math.ceil(windowMs / 1000);

  rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
    prefix: `ccd:rl:${keyPrefix}`,
    analytics: true,
  });

  ratelimitCache.set(cacheKey, rl);
  return rl;
}

/**
 * Drop-in replacement for the in-memory `rateLimit()` function.
 *
 * - Uses Upstash Redis sliding window when env vars are configured.
 * - Falls back to the existing in-memory rate limiter if Redis is unavailable.
 *
 * @param userId  - User identifier to rate-limit
 * @param opts    - Rate-limit options (windowMs, max, keyPrefix)
 */
export async function redisRateLimit(
  userId: string,
  opts: RateLimitOptions = {}
): Promise<{ limited: boolean; response?: NextResponse }> {
  const { windowMs = 60_000, max = 100, keyPrefix = 'api' } = opts;

  const rl = getOrCreateRatelimit(keyPrefix, windowMs, max);

  // Fallback to in-memory if Redis not available
  if (!rl) {
    return rateLimit(userId, opts);
  }

  try {
    const result = await rl.limit(`${keyPrefix}:${userId}`);

    if (!result.success) {
      const resetSec = Math.ceil((result.reset - Date.now()) / 1000);
      const resp = error('Too many requests', 429);
      resp.headers.set('X-RateLimit-Limit', String(result.limit));
      resp.headers.set('X-RateLimit-Remaining', String(result.remaining));
      resp.headers.set('X-RateLimit-Reset', String(resetSec));
      resp.headers.set('Retry-After', String(resetSec));
      return { limited: true, response: resp };
    }

    return { limited: false };
  } catch {
    // Redis error — fall back to in-memory
    return rateLimit(userId, opts);
  }
}

/* -------------------------------------------------------------------------- */
/*  Per-user daily token quota                                                */
/* -------------------------------------------------------------------------- */

const DAILY_QUOTA_PREFIX = 'ccd:daily-quota';

/**
 * Check and enforce a per-user daily token consumption limit.
 *
 * Tracks cumulative token usage per user per day in Redis.
 * Falls back to allowing all requests when Redis is unavailable
 * (since the primary budget check in `ai_settings` still applies).
 *
 * @param userId     - User identifier
 * @param tokensUsed - Tokens consumed in the current request
 * @param dailyLimit - Maximum tokens allowed per user per day (default 200,000)
 * @returns `{ allowed, used, remaining }` — whether the request is within quota
 */
export async function checkDailyQuota(
  userId: string,
  tokensUsed: number,
  dailyLimit = 200_000
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const redis = getRedis();
  if (!redis) {
    return { allowed: true, used: 0, remaining: dailyLimit };
  }

  try {
    // Key expires at midnight UTC
    const today = new Date().toISOString().split('T')[0];
    const key = `${DAILY_QUOTA_PREFIX}:${userId}:${today}`;

    const currentUsage = (await redis.get<number>(key)) ?? 0;

    if (currentUsage + tokensUsed > dailyLimit) {
      return {
        allowed: false,
        used: currentUsage,
        remaining: Math.max(dailyLimit - currentUsage, 0),
      };
    }

    // Increment usage and set TTL to end of day (max 24h)
    await redis.incrby(key, tokensUsed);
    await redis.expire(key, 86400);

    return {
      allowed: true,
      used: currentUsage + tokensUsed,
      remaining: Math.max(dailyLimit - currentUsage - tokensUsed, 0),
    };
  } catch {
    // Redis error — allow (tenant-level budget still applies)
    return { allowed: true, used: 0, remaining: dailyLimit };
  }
}

/* -------------------------------------------------------------------------- */
/*  Per-tenant concurrency limiter                                            */
/* -------------------------------------------------------------------------- */

const CONCURRENCY_PREFIX = 'ccd:concurrency';

/**
 * Limit the number of concurrent AI requests per tenant.
 *
 * Acquires a "slot" before the request and releases it after.
 * Returns a `release` function that should be called when the
 * request completes.
 *
 * Falls back to allowing all requests when Redis is unavailable.
 *
 * @param tenantId      - Tenant UUID
 * @param maxConcurrent - Maximum concurrent requests (default 5)
 * @returns `{ allowed, release }` — whether request can proceed + cleanup fn
 */
export async function checkConcurrency(
  tenantId: string,
  maxConcurrent = 5
): Promise<{ allowed: boolean; release: () => Promise<void> }> {
  const redis = getRedis();
  const noop = async () => {};

  if (!redis) {
    return { allowed: true, release: noop };
  }

  try {
    const key = `${CONCURRENCY_PREFIX}:${tenantId}`;
    const current = await redis.incr(key);

    // Set TTL as a safety net in case release is never called
    await redis.expire(key, 300); // 5 minutes max

    if (current > maxConcurrent) {
      // Over the limit — decrement and reject
      await redis.decr(key);
      return { allowed: false, release: noop };
    }

    return {
      allowed: true,
      release: async () => {
        try {
          const val = await redis.decr(key);
          if (val <= 0) {
            await redis.del(key);
          }
        } catch { /* ignore cleanup errors */ }
      },
    };
  } catch {
    return { allowed: true, release: noop };
  }
}

// Re-export RateLimitOptions type for convenience
export type { RateLimitOptions } from './rate-limit';
