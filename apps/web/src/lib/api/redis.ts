import { Redis } from '@upstash/redis';

/**
 * Singleton Redis client backed by Upstash.
 *
 * Returns `null` when the required env vars (`UPSTASH_REDIS_URL` and
 * `UPSTASH_REDIS_TOKEN`) are not set, so consumers can gracefully
 * fall back to in-memory implementations.
 */
let _redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    _redis = null;
    return null;
  }

  try {
    _redis = new Redis({ url, token });
    return _redis;
  } catch {
    _redis = null;
    return null;
  }
}
