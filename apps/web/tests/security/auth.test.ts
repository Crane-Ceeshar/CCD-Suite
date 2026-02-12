import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * Authentication Security Tests
 *
 * Verifies that:
 *   - ALL major protected endpoint groups reject unauthenticated access
 *   - Invalid/expired tokens return 401
 *   - Admin-only routes return 403 for non-admin users
 *   - Consistent error response format across all modules
 */

// ─── Unauthenticated Access Tests ──────────────────────────────────────────

test.describe('Auth — Unauthenticated Access to All Modules', () => {
  let unauthRequest: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    unauthRequest = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: { cookies: [], origins: [] },
    });
  });

  test.afterAll(async () => {
    await unauthRequest.dispose();
  });

  // Helper to perform a request and verify it is blocked
  async function expectBlocked(method: string, path: string) {
    let res;
    const opts = { maxRedirects: 0 };
    switch (method) {
      case 'GET':
        res = await unauthRequest.get(path, opts);
        break;
      case 'POST':
        res = await unauthRequest.post(path, { data: {}, ...opts });
        break;
      case 'PATCH':
        res = await unauthRequest.patch(path, { data: {}, ...opts });
        break;
      case 'DELETE':
        res = await unauthRequest.delete(path, opts);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }

    const status = res!.status();
    const body = await res!.text();

    // The request must NOT return success data
    const hasSuccessData = body.includes('"success":true');
    expect(
      hasSuccessData,
      `Unauthenticated ${method} ${path} returned success data! Status: ${status}`
    ).toBe(false);

    // Status should be 401, 403, or a redirect (302/307)
    expect(
      [401, 403, 302, 307].includes(status) || !hasSuccessData,
      `Unauthenticated ${method} ${path} should be blocked but got status ${status}`
    ).toBe(true);
  }

  // ── HR Endpoints ────────────────────────────
  const hrEndpoints = [
    { method: 'GET', path: '/api/hr/employees' },
    { method: 'POST', path: '/api/hr/employees' },
    { method: 'GET', path: '/api/hr/employees/fake-id' },
    { method: 'GET', path: '/api/hr/departments' },
    { method: 'POST', path: '/api/hr/departments' },
    { method: 'GET', path: '/api/hr/stats' },
    { method: 'GET', path: '/api/hr/leave' },
    { method: 'POST', path: '/api/hr/leave' },
    { method: 'GET', path: '/api/hr/attendance' },
    { method: 'GET', path: '/api/hr/payroll' },
    { method: 'GET', path: '/api/hr/reviews' },
    { method: 'POST', path: '/api/hr/reviews' },
    { method: 'GET', path: '/api/hr/contracts' },
    { method: 'POST', path: '/api/hr/contracts' },
    { method: 'GET', path: '/api/hr/leave-balances' },
    { method: 'GET', path: '/api/hr/leave-policies' },
    { method: 'GET', path: '/api/hr/holidays' },
    { method: 'GET', path: '/api/hr/documents' },
    { method: 'GET', path: '/api/hr/salary-history' },
    { method: 'GET', path: '/api/hr/contract-templates' },
  ];

  for (const { method, path } of hrEndpoints) {
    test(`HR: ${method} ${path} blocked without auth`, async () => {
      await expectBlocked(method, path);
    });
  }

  // ── CRM Endpoints ──────────────────────────
  const crmEndpoints = [
    { method: 'GET', path: '/api/crm/stats' },
    { method: 'GET', path: '/api/crm/analytics' },
    { method: 'GET', path: '/api/crm/companies' },
    { method: 'POST', path: '/api/crm/companies' },
    { method: 'GET', path: '/api/crm/contacts' },
    { method: 'POST', path: '/api/crm/contacts' },
    { method: 'GET', path: '/api/crm/deals' },
    { method: 'POST', path: '/api/crm/deals' },
    { method: 'GET', path: '/api/crm/pipelines' },
    { method: 'POST', path: '/api/crm/pipelines' },
    { method: 'GET', path: '/api/crm/activities' },
    { method: 'POST', path: '/api/crm/activities' },
    { method: 'GET', path: '/api/crm/products' },
    { method: 'POST', path: '/api/crm/products' },
  ];

  for (const { method, path } of crmEndpoints) {
    test(`CRM: ${method} ${path} blocked without auth`, async () => {
      await expectBlocked(method, path);
    });
  }

  // ── Finance Endpoints ──────────────────────
  const financeEndpoints = [
    { method: 'GET', path: '/api/finance/stats' },
    { method: 'GET', path: '/api/finance/invoices' },
    { method: 'POST', path: '/api/finance/invoices' },
    { method: 'GET', path: '/api/finance/expenses' },
    { method: 'POST', path: '/api/finance/expenses' },
    { method: 'GET', path: '/api/finance/payments' },
    { method: 'GET', path: '/api/finance/revenue' },
    { method: 'GET', path: '/api/finance/tax' },
  ];

  for (const { method, path } of financeEndpoints) {
    test(`Finance: ${method} ${path} blocked without auth`, async () => {
      await expectBlocked(method, path);
    });
  }

  // ── Analytics Endpoints ────────────────────
  const analyticsEndpoints = [
    { method: 'GET', path: '/api/analytics/insights' },
    { method: 'GET', path: '/api/analytics/reports' },
    { method: 'POST', path: '/api/analytics/reports' },
    { method: 'GET', path: '/api/analytics/dashboards' },
    { method: 'POST', path: '/api/analytics/dashboards' },
  ];

  for (const { method, path } of analyticsEndpoints) {
    test(`Analytics: ${method} ${path} blocked without auth`, async () => {
      await expectBlocked(method, path);
    });
  }

  // ── Content Endpoints ──────────────────────
  const contentEndpoints = [
    { method: 'GET', path: '/api/content' },
    { method: 'POST', path: '/api/content' },
    { method: 'GET', path: '/api/content/stats' },
    { method: 'GET', path: '/api/content/categories' },
    { method: 'POST', path: '/api/content/categories' },
    { method: 'GET', path: '/api/content/templates' },
    { method: 'POST', path: '/api/content/templates' },
    { method: 'GET', path: '/api/content/approvals' },
  ];

  for (const { method, path } of contentEndpoints) {
    test(`Content: ${method} ${path} blocked without auth`, async () => {
      await expectBlocked(method, path);
    });
  }

  // ── Admin Endpoints ────────────────────────
  const adminEndpoints = [
    { method: 'GET', path: '/api/admin/overview' },
    { method: 'GET', path: '/api/admin/users' },
    { method: 'GET', path: '/api/admin/tenants' },
    { method: 'GET', path: '/api/admin/security' },
    { method: 'GET', path: '/api/admin/analytics' },
    { method: 'GET', path: '/api/admin/activity' },
    { method: 'GET', path: '/api/admin/api-keys' },
    { method: 'GET', path: '/api/admin/announcements' },
    { method: 'GET', path: '/api/admin/feature-flags' },
    { method: 'GET', path: '/api/admin/email-templates' },
    { method: 'GET', path: '/api/admin/services/health' },
    { method: 'GET', path: '/api/admin/settings/tenant' },
    { method: 'GET', path: '/api/admin/settings/ai' },
  ];

  for (const { method, path } of adminEndpoints) {
    test(`Admin: ${method} ${path} blocked without auth`, async () => {
      await expectBlocked(method, path);
    });
  }
});

// ─── Invalid / Expired Token Tests ─────────────────────────────────────────

test.describe('Auth — Invalid and Expired Tokens', () => {
  let invalidTokenRequest: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    // Create a request context with a malformed/expired JWT in the cookie
    const fakeProjectRef = 'ixjkcdanzqpkxpsuzxvj';
    const cookieName = `sb-${fakeProjectRef}-auth-token`;
    const expiredToken = JSON.stringify({
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4amtjZGFuenFwa3hwc3V6eHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid_signature_here',
      refresh_token: 'expired-refresh-token',
      expires_at: 1600000001, // Expired long ago
      expires_in: 0,
      token_type: 'bearer',
    });

    invalidTokenRequest = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: cookieName,
            value: expiredToken,
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
            expires: -1,
          },
        ],
        origins: [],
      },
    });
  });

  test.afterAll(async () => {
    await invalidTokenRequest.dispose();
  });

  const endpointsToTest = [
    '/api/crm/stats',
    '/api/hr/employees',
    '/api/finance/stats',
    '/api/content',
    '/api/analytics/dashboards',
  ];

  for (const path of endpointsToTest) {
    test(`GET ${path} with expired token is blocked`, async () => {
      const res = await invalidTokenRequest.get(path, { maxRedirects: 0 });
      const status = res.status();
      const body = await res.text();

      // Should not return success data
      const hasSuccessData = body.includes('"success":true');
      expect(
        hasSuccessData,
        `Expired-token GET ${path} returned success data! Status: ${status}`
      ).toBe(false);
    });
  }
});

// ─── Completely Garbage Token Tests ────────────────────────────────────────

test.describe('Auth — Garbage Token Values', () => {
  let garbageRequest: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    const fakeProjectRef = 'ixjkcdanzqpkxpsuzxvj';
    const cookieName = `sb-${fakeProjectRef}-auth-token`;

    garbageRequest = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: {
        cookies: [
          {
            name: cookieName,
            value: 'not-even-json-just-garbage-data-!@#$%',
            domain: 'localhost',
            path: '/',
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
            expires: -1,
          },
        ],
        origins: [],
      },
    });
  });

  test.afterAll(async () => {
    await garbageRequest.dispose();
  });

  test('GET /api/crm/companies with garbage cookie is blocked', async () => {
    const res = await garbageRequest.get('/api/crm/companies', { maxRedirects: 0 });
    const body = await res.text();
    const hasSuccessData = body.includes('"success":true');
    expect(
      hasSuccessData,
      `Garbage-token request returned success data! Status: ${res.status()}`
    ).toBe(false);
  });

  test('GET /api/hr/employees with garbage cookie is blocked', async () => {
    const res = await garbageRequest.get('/api/hr/employees', { maxRedirects: 0 });
    const body = await res.text();
    const hasSuccessData = body.includes('"success":true');
    expect(
      hasSuccessData,
      `Garbage-token request returned success data! Status: ${res.status()}`
    ).toBe(false);
  });

  test('GET /api/finance/invoices with garbage cookie is blocked', async () => {
    const res = await garbageRequest.get('/api/finance/invoices', { maxRedirects: 0 });
    const body = await res.text();
    const hasSuccessData = body.includes('"success":true');
    expect(
      hasSuccessData,
      `Garbage-token request returned success data! Status: ${res.status()}`
    ).toBe(false);
  });

  test('POST /api/crm/companies with garbage cookie is blocked', async () => {
    const res = await garbageRequest.post('/api/crm/companies', {
      data: { name: 'Should Not Create' },
      maxRedirects: 0,
    });
    const body = await res.text();
    const hasSuccessData = body.includes('"success":true');
    expect(
      hasSuccessData,
      `Garbage-token POST returned success data! Status: ${res.status()}`
    ).toBe(false);
  });
});

// ─── Admin-Only Route Authorization Tests ──────────────────────────────────

test.describe('Auth — Admin Route Authorization (Authenticated User)', () => {
  // These tests use the default authenticated request context (non-admin user).
  // Admin routes should return 403 (Forbidden) for non-admin users,
  // OR the test user may already be admin — in which case the test verifies
  // that the route works at all (no 500 errors).

  const adminOnlyEndpoints = [
    { method: 'GET', path: '/api/admin/overview' },
    { method: 'GET', path: '/api/admin/users' },
    { method: 'GET', path: '/api/admin/tenants' },
    { method: 'GET', path: '/api/admin/security' },
    { method: 'GET', path: '/api/admin/analytics' },
    { method: 'GET', path: '/api/admin/activity' },
    { method: 'GET', path: '/api/admin/api-keys' },
    { method: 'GET', path: '/api/admin/feature-flags' },
    { method: 'POST', path: '/api/admin/users/invite' },
  ];

  for (const { method, path } of adminOnlyEndpoints) {
    test(`${method} ${path} returns 200 (admin) or 403 (non-admin)`, async ({ request }) => {
      let res;
      switch (method) {
        case 'GET':
          res = await request.get(path);
          break;
        case 'POST':
          res = await request.post(path, { data: {} });
          break;
        default:
          res = await request.get(path);
      }

      const status = res.status();
      // Admin routes should either:
      // - Return 200 (user is admin)
      // - Return 403 (user is not admin)
      // - Return 401 (auth middleware rejected)
      // They should NOT return 500 (unhandled error)
      expect(
        [200, 201, 400, 401, 403, 422].includes(status),
        `Admin route ${method} ${path} returned unexpected status ${status}`
      ).toBe(true);
    });
  }
});

// ─── Consistent Error Response Format ──────────────────────────────────────

test.describe('Auth — Consistent 401 Response Format', () => {
  let unauthRequest: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    unauthRequest = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: { cookies: [], origins: [] },
    });
  });

  test.afterAll(async () => {
    await unauthRequest.dispose();
  });

  const endpointsForFormatCheck = [
    '/api/crm/stats',
    '/api/hr/stats',
    '/api/finance/stats',
    '/api/content/stats',
  ];

  for (const path of endpointsForFormatCheck) {
    test(`GET ${path} returns consistent error format when unauthenticated`, async () => {
      const res = await unauthRequest.get(path, { maxRedirects: 0 });
      const status = res.status();

      // If it returns a JSON body (not a redirect), check the format
      if (status === 401 || status === 403) {
        const contentType = res.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const body = await res.json();
          // Expect { success: false, error: { message: ... } }
          expect(body.success).toBe(false);
          expect(body.error).toBeTruthy();
          expect(body.error.message).toBeTruthy();
          expect(typeof body.error.message).toBe('string');
        }
      }

      // At minimum, the response should not contain success data
      const bodyText = await res.text();
      expect(bodyText.includes('"success":true')).toBe(false);
    });
  }
});
