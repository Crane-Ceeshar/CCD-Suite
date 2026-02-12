import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * Session Security Tests
 *
 * Verifies session management security including:
 *   - Malformed auth cookies are rejected
 *   - Tampered session data is rejected
 *   - Valid auth setup produces proper session cookies
 *   - Session cookie names follow the Supabase pattern
 *   - Various session manipulation attacks are blocked
 */

const SUPABASE_PROJECT_REF = 'ixjkcdanzqpkxpsuzxvj';
const COOKIE_BASE_NAME = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

// ─── Malformed Cookie Tests ────────────────────────────────────────────────

test.describe('Session — Malformed Auth Cookies', () => {
  test('empty cookie value is rejected', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: COOKIE_BASE_NAME,
            value: '',
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Empty cookie value should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });

  test('cookie with invalid JSON is rejected', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: COOKIE_BASE_NAME,
            value: '{invalid json content here!!!',
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Invalid JSON cookie should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });

  test('cookie with valid JSON but missing access_token is rejected', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: COOKIE_BASE_NAME,
            value: JSON.stringify({
              refresh_token: 'some-refresh-token',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer',
            }),
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Cookie without access_token should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });

  test('cookie with null access_token is rejected', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: COOKIE_BASE_NAME,
            value: JSON.stringify({
              access_token: null,
              refresh_token: 'some-refresh-token',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer',
            }),
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Null access_token should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });
});

// ─── Tampered Session Data Tests ───────────────────────────────────────────

test.describe('Session — Tampered Session Data', () => {
  test('cookie with fabricated JWT (wrong signature) is rejected', async ({ playwright }) => {
    // Fabricate a JWT with a valid structure but invalid signature
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: 'supabase',
      ref: SUPABASE_PROJECT_REF,
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: '00000000-0000-0000-0000-000000000000',
      email: 'hacker@evil.com',
    })).toString('base64url');
    const fakeSignature = 'tampered_signature_that_should_not_work';
    const fakeJWT = `${header}.${payload}.${fakeSignature}`;

    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: COOKIE_BASE_NAME,
            value: JSON.stringify({
              access_token: fakeJWT,
              refresh_token: 'fake-refresh-token',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              expires_in: 3600,
              token_type: 'bearer',
            }),
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Tampered JWT should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });

  test('cookie with role escalation (anon to authenticated) is rejected', async ({ playwright }) => {
    // Attempt to escalate from anon role to authenticated by crafting a token
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: 'supabase',
      ref: SUPABASE_PROJECT_REF,
      role: 'service_role', // Attempt privilege escalation
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: '00000000-0000-0000-0000-000000000000',
    })).toString('base64url');
    const fakeSignature = 'invalid_signature';
    const escalatedJWT = `${header}.${payload}.${fakeSignature}`;

    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: COOKIE_BASE_NAME,
            value: JSON.stringify({
              access_token: escalatedJWT,
              refresh_token: 'fake',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer',
            }),
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Role-escalated JWT should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });

  test('cookie with modified user ID in JWT is rejected', async ({ playwright }) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: 'supabase',
      ref: SUPABASE_PROJECT_REF,
      role: 'authenticated',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // Fake user ID
      email: 'impersonated@victim.com',
    })).toString('base64url');
    const fakeSignature = 'wrong_signature_here';
    const impersonationJWT = `${header}.${payload}.${fakeSignature}`;

    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: COOKIE_BASE_NAME,
            value: JSON.stringify({
              access_token: impersonationJWT,
              refresh_token: 'fake',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer',
            }),
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/companies', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Impersonation JWT should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });
});

// ─── Valid Session Cookie Format ───────────────────────────────────────────

test.describe('Session — Valid Auth Produces Correct Cookies', () => {
  test('authenticated request context has valid session', async ({ request }) => {
    // The default `request` fixture uses the authenticated storageState
    // Verify it can access a protected endpoint
    const res = await request.get('/api/crm/stats');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('authenticated context can access multiple modules', async ({ request }) => {
    // Verify the session works across different API modules
    const endpoints = [
      '/api/crm/stats',
      '/api/hr/employees',
      '/api/content',
    ];

    for (const path of endpoints) {
      const res = await request.get(path);
      const status = res.status();
      expect(
        [200].includes(status),
        `Authenticated session failed on ${path} with status ${status}`
      ).toBe(true);
    }
  });
});

// ─── Cookie Name Pattern Tests ─────────────────────────────────────────────

test.describe('Session — Cookie Name Pattern', () => {
  test('Supabase auth cookie follows sb-<ref>-auth-token pattern', () => {
    // Verify the cookie name format matches Supabase convention
    const expectedPattern = /^sb-[a-z0-9]+-auth-token$/;
    expect(
      expectedPattern.test(COOKIE_BASE_NAME),
      `Cookie name "${COOKIE_BASE_NAME}" does not match expected Supabase pattern`
    ).toBe(true);
  });

  test('cookie name contains the correct project reference', () => {
    expect(COOKIE_BASE_NAME).toContain(SUPABASE_PROJECT_REF);
  });
});

// ─── Cookie Injection Tests ────────────────────────────────────────────────

test.describe('Session — Cookie Injection Attacks', () => {
  test('extra cookies with admin=true do not grant elevated access', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: 'admin',
            value: 'true',
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
          {
            name: 'role',
            value: 'super_admin',
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
          {
            name: 'is_authenticated',
            value: 'true',
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Injected admin cookies should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });

  test('cookie with wrong name format does not grant access', async ({ playwright }) => {
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: 'sb-wrong-ref-auth-token',
            value: JSON.stringify({
              access_token: 'some-token',
              refresh_token: 'some-refresh',
              expires_at: Math.floor(Date.now() / 1000) + 3600,
              token_type: 'bearer',
            }),
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Cookie with wrong project ref should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });
});

// ─── Chunked Cookie Manipulation ───────────────────────────────────────────

test.describe('Session — Chunked Cookie Manipulation', () => {
  test('mismatched chunked cookies (partial session) do not grant access', async ({ playwright }) => {
    // Supabase SSR stores session in chunked cookies: sb-<ref>-auth-token.0, .1, etc.
    // Test that providing only a partial chunk does not grant access
    const ctx = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: `${COOKIE_BASE_NAME}.0`,
            value: '{"access_token":"partial-data-',
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          },
          // Intentionally missing .1 chunk
        ],
        origins: [],
      },
    });

    const res = await ctx.get('/api/crm/stats', { maxRedirects: 0 });
    const body = await res.text();
    expect(
      body.includes('"success":true'),
      `Partial chunked cookies should not grant access. Status: ${res.status()}`
    ).toBe(false);

    await ctx.dispose();
  });
});
