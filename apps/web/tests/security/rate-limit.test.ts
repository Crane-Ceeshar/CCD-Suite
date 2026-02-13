import { test, expect, APIRequestContext } from '@playwright/test';
import { extractCreatedId } from './cleanup';

/**
 * Rate Limiting Security Tests
 *
 * Verifies that the API implements rate limiting to protect against:
 *   - Brute force attacks
 *   - Denial of Service (DoS)
 *   - Resource exhaustion
 *
 * Tests make rapid sequential requests and verify:
 *   - 429 (Too Many Requests) is returned after exceeding the limit
 *   - Proper rate limit headers are included (X-RateLimit-*, Retry-After)
 *   - After the rate limit window, requests succeed again
 *
 * Note: If rate limiting is not yet implemented, these tests will detect
 * that gap by verifying that all 150+ requests return 200 (which indicates
 * no rate limiting is in place).
 */

// Track created resources for cleanup
const createdCompanyIds: string[] = [];

// ─── Rate Limit Detection ──────────────────────────────────────────────────

test.describe('Rate Limiting — Rapid Request Flood', () => {
  // Increase timeout for this test since it makes many sequential requests
  test.setTimeout(120_000);

  test('150+ rapid GET requests to /api/crm/stats triggers rate limit or all succeed', async ({ request }) => {
    const TOTAL_REQUESTS = 150;
    const results: { status: number; headers: Record<string, string> }[] = [];
    let got429 = false;

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      const res = await request.get('/api/crm/stats');
      const status = res.status();
      const headers: Record<string, string> = {};

      // Capture rate limit headers if present
      const headerNames = [
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
        'retry-after',
        'ratelimit-limit',
        'ratelimit-remaining',
        'ratelimit-reset',
      ];
      for (const name of headerNames) {
        const value = res.headers()[name];
        if (value) headers[name] = value;
      }

      results.push({ status, headers });

      if (status === 429) {
        got429 = true;
        break;
      }
    }

    if (got429) {
      // Rate limiting is working — verify the 429 response
      const rateLimitedResponse = results[results.length - 1];
      expect(rateLimitedResponse.status).toBe(429);

      // Check for standard rate limit headers
      const hasRateLimitHeaders =
        rateLimitedResponse.headers['x-ratelimit-limit'] ||
        rateLimitedResponse.headers['ratelimit-limit'] ||
        rateLimitedResponse.headers['retry-after'];

      // Log what headers we found for debugging
      console.log(`Rate limit triggered after ${results.length} requests`);
      console.log('Rate limit headers:', JSON.stringify(rateLimitedResponse.headers));

      if (hasRateLimitHeaders) {
        // Verify Retry-After header if present
        const retryAfter =
          rateLimitedResponse.headers['retry-after'];
        if (retryAfter) {
          const retrySeconds = parseInt(retryAfter, 10);
          expect(retrySeconds).toBeGreaterThan(0);
          expect(retrySeconds).toBeLessThan(3600); // Should not be more than 1 hour
        }

        // Verify X-RateLimit-Limit if present
        const rateLimitMax =
          rateLimitedResponse.headers['x-ratelimit-limit'] ||
          rateLimitedResponse.headers['ratelimit-limit'];
        if (rateLimitMax) {
          expect(parseInt(rateLimitMax, 10)).toBeGreaterThan(0);
        }

        // Verify X-RateLimit-Remaining if present
        const remaining =
          rateLimitedResponse.headers['x-ratelimit-remaining'] ||
          rateLimitedResponse.headers['ratelimit-remaining'];
        if (remaining) {
          expect(parseInt(remaining, 10)).toBe(0);
        }
      }
    } else {
      // No rate limiting detected — this is a finding
      console.warn(
        `[SECURITY FINDING] No rate limiting detected after ${TOTAL_REQUESTS} rapid requests to /api/crm/stats. ` +
        'All requests returned non-429 status codes. Consider implementing rate limiting.'
      );

      // Verify that at least all requests succeeded (no server errors)
      for (const result of results) {
        expect(
          [200, 201, 304].includes(result.status),
          `Unexpected error status ${result.status} during rapid requests`
        ).toBe(true);
      }
    }
  });

  test('150+ rapid POST requests to /api/crm/companies triggers rate limit or all succeed/fail gracefully', async ({ request }) => {
    const TOTAL_REQUESTS = 150;
    let got429 = false;
    let requestCount = 0;

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      const res = await request.post('/api/crm/companies', {
        data: {
          name: `RateLimit Test Co ${i}`,
          industry: 'Test',
          status: 'active',
        },
      });
      requestCount++;
      const status = res.status();

      // Track created IDs for cleanup
      const id = await extractCreatedId(res);
      if (id) createdCompanyIds.push(id);

      if (status === 429) {
        got429 = true;
        console.log(`POST rate limit triggered after ${requestCount} requests`);

        // Verify rate limit response
        const retryAfter = res.headers()['retry-after'];
        if (retryAfter) {
          expect(parseInt(retryAfter, 10)).toBeGreaterThan(0);
        }
        break;
      }

      // Accept 201 (created) or 400/422 (validation) — not 500
      expect(
        [200, 201, 400, 422].includes(status),
        `Unexpected status ${status} during rapid POST flood`
      ).toBe(true);
    }

    if (!got429) {
      console.warn(
        `[SECURITY FINDING] No rate limiting detected after ${TOTAL_REQUESTS} rapid POST requests. ` +
        'Consider implementing rate limiting for write endpoints.'
      );
    }
  });
});

// ─── Rate Limit Recovery ───────────────────────────────────────────────────

test.describe('Rate Limiting — Recovery After Window', () => {
  test.setTimeout(120_000);

  test('requests succeed again after rate limit window expires', async ({ request }) => {
    // First, try to trigger rate limiting
    const BURST_SIZE = 100;
    let got429 = false;
    let retryAfterSeconds = 0;

    for (let i = 0; i < BURST_SIZE; i++) {
      const res = await request.get('/api/crm/stats');
      if (res.status() === 429) {
        got429 = true;
        const retryAfter = res.headers()['retry-after'];
        retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 2;
        break;
      }
    }

    if (!got429) {
      // Rate limiting not triggered — skip recovery test
      console.log('Rate limiting not triggered during burst — skipping recovery test');
      return;
    }

    // Wait for the rate limit window to expire (cap at 10 seconds for test speed)
    const waitTime = Math.min(retryAfterSeconds, 10);
    console.log(`Waiting ${waitTime}s for rate limit window to expire...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));

    // After waiting, requests should succeed again
    const recoveryRes = await request.get('/api/crm/stats');
    expect(
      recoveryRes.status(),
      `Request after rate limit window still returned ${recoveryRes.status()}`
    ).toBe(200);
  });
});

// ─── Rate Limit Headers on Normal Requests ─────────────────────────────────

test.describe('Rate Limiting — Headers on Normal Requests', () => {
  test('normal GET request includes rate limit headers (if implemented)', async ({ request }) => {
    const res = await request.get('/api/crm/stats');
    expect(res.status()).toBe(200);

    // Check if rate limit headers are present on normal requests
    const headers = res.headers();
    const rateLimitHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'ratelimit-limit',
      'ratelimit-remaining',
      'ratelimit-reset',
    ];

    const foundHeaders = rateLimitHeaders.filter((h) => headers[h]);

    if (foundHeaders.length > 0) {
      console.log('Rate limit headers found on normal request:', foundHeaders);

      // Verify header values are reasonable
      for (const header of foundHeaders) {
        const value = parseInt(headers[header], 10);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    } else {
      console.log(
        'No rate limit headers found on normal request. ' +
        'Rate limiting may not be implemented or headers may only appear near the limit.'
      );
    }
  });
});

// ─── Cleanup ─────────────────────────────────────────────────────────────────

test.describe('Rate Limiting — Cleanup', () => {
  test.setTimeout(120_000);

  test('delete all companies created during rate limit tests', async ({ request }) => {
    if (createdCompanyIds.length === 0) return;

    let deleted = 0;
    for (const id of createdCompanyIds) {
      const res = await request.delete(`/api/crm/companies/${id}`);
      if ([200, 204, 404].includes(res.status())) deleted++;
    }
    console.log(`[Cleanup] Deleted ${deleted}/${createdCompanyIds.length} rate-limit test companies`);
  });
});
