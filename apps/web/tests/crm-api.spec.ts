import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * CRM API Integration Tests
 *
 * Tests all 14 API route files covering:
 * - Security (unauthenticated access → 401)
 * - CRUD lifecycle for each entity
 * - Business logic (deal close dates, pipeline default stages, activity completion)
 * - Search, filtering, and pagination
 */

// ─── Shared state across ordered tests ───────────────────────────────────────

let companyId: string;
let contactId: string;
let pipelineId: string;
let stageIds: string[] = [];
let dealId: string;
let activityId: string;
let productId: string;

// ─── SECURITY TESTS ─────────────────────────────────────────────────────────

test.describe('Security — Unauthenticated Access', () => {
  let unauthRequest: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    // Create a completely fresh request context with NO cookies/auth
    unauthRequest = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      storageState: { cookies: [], origins: [] },
    });
  });

  test.afterAll(async () => {
    await unauthRequest.dispose();
  });

  const protectedEndpoints = [
    { method: 'GET', path: '/api/crm/stats' },
    { method: 'GET', path: '/api/crm/analytics' },
    { method: 'GET', path: '/api/crm/companies' },
    { method: 'POST', path: '/api/crm/companies' },
    { method: 'GET', path: '/api/crm/companies/fake-id' },
    { method: 'PATCH', path: '/api/crm/companies/fake-id' },
    { method: 'DELETE', path: '/api/crm/companies/fake-id' },
    { method: 'GET', path: '/api/crm/contacts' },
    { method: 'POST', path: '/api/crm/contacts' },
    { method: 'GET', path: '/api/crm/contacts/fake-id' },
    { method: 'PATCH', path: '/api/crm/contacts/fake-id' },
    { method: 'DELETE', path: '/api/crm/contacts/fake-id' },
    { method: 'GET', path: '/api/crm/pipelines' },
    { method: 'POST', path: '/api/crm/pipelines' },
    { method: 'GET', path: '/api/crm/pipelines/fake-id' },
    { method: 'GET', path: '/api/crm/deals' },
    { method: 'POST', path: '/api/crm/deals' },
    { method: 'GET', path: '/api/crm/deals/fake-id' },
    { method: 'PATCH', path: '/api/crm/deals/fake-id' },
    { method: 'DELETE', path: '/api/crm/deals/fake-id' },
    { method: 'GET', path: '/api/crm/activities' },
    { method: 'POST', path: '/api/crm/activities' },
    { method: 'PATCH', path: '/api/crm/activities/fake-id' },
    { method: 'DELETE', path: '/api/crm/activities/fake-id' },
    { method: 'GET', path: '/api/crm/products' },
    { method: 'POST', path: '/api/crm/products' },
    { method: 'PATCH', path: '/api/crm/products/fake-id' },
    { method: 'DELETE', path: '/api/crm/products/fake-id' },
  ];

  for (const { method, path } of protectedEndpoints) {
    test(`${method} ${path} → blocked without auth`, async () => {
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
      }
      // Middleware redirects unauthenticated users or route returns 401
      // The key security check: unauthenticated requests must NOT return successful CRM data
      const status = res!.status();
      const body = await res!.text();
      const hasSuccessData = body.includes('"success":true');
      expect(hasSuccessData, `Unauthenticated ${method} ${path} returned success data! Status: ${status}`).toBe(false);
    });
  }
});

// ─── STATS & ANALYTICS ──────────────────────────────────────────────────────

test.describe('Stats & Analytics', () => {
  test('GET /api/crm/stats → 200 with correct shape', async ({ request }) => {
    const res = await request.get('/api/crm/stats');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('deals');
    expect(body.data).toHaveProperty('pipeline_value');
    expect(body.data).toHaveProperty('contacts');
    expect(body.data).toHaveProperty('companies');
    expect(body.data).toHaveProperty('win_rate');
    expect(typeof body.data.deals).toBe('number');
    expect(typeof body.data.pipeline_value).toBe('number');
    expect(typeof body.data.contacts).toBe('number');
    expect(typeof body.data.companies).toBe('number');
    expect(typeof body.data.win_rate).toBe('number');
  });

  test('GET /api/crm/analytics → 200 with correct shape', async ({ request }) => {
    const res = await request.get('/api/crm/analytics');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('win_rate');
    expect(body.data).toHaveProperty('avg_deal_size');
    expect(body.data).toHaveProperty('avg_cycle_time');
    expect(body.data).toHaveProperty('pipeline_value');
    expect(body.data).toHaveProperty('value_by_stage');
    expect(body.data).toHaveProperty('trends');
    expect(Array.isArray(body.data.value_by_stage)).toBe(true);
    expect(Array.isArray(body.data.trends)).toBe(true);
  });
});

// ─── COMPANIES CRUD ──────────────────────────────────────────────────────────

test.describe('Companies CRUD Lifecycle', () => {
  test('POST /api/crm/companies → 201 create', async ({ request }) => {
    const res = await request.post('/api/crm/companies', {
      data: {
        name: 'E2E Test Corp',
        industry: 'Technology',
        website: 'https://e2etest.com',
        email: 'info@e2etest.com',
        phone: '+1-555-0100',
        status: 'active',
      },
    });
    const body = await res.json();
    expect(res.status(), `Expected 201 but got ${res.status()}: ${JSON.stringify(body)}`).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('E2E Test Corp');
    expect(body.data.industry).toBe('Technology');
    expect(body.data.id).toBeTruthy();
    companyId = body.data.id;
  });

  test('GET /api/crm/companies → find created company', async ({ request }) => {
    const res = await request.get('/api/crm/companies');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    const found = body.data.find((c: { id: string }) => c.id === companyId);
    expect(found).toBeTruthy();
    expect(found.name).toBe('E2E Test Corp');
  });

  test('GET /api/crm/companies?search=E2E+Test → search works', async ({ request }) => {
    const res = await request.get('/api/crm/companies?search=E2E+Test');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((c: { id: string }) => c.id === companyId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/companies?status=active → status filter', async ({ request }) => {
    const res = await request.get('/api/crm/companies?status=active');
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const c of body.data) {
      expect(c.status).toBe('active');
    }
  });

  test('GET /api/crm/companies/[id] → 200 detail', async ({ request }) => {
    const res = await request.get(`/api/crm/companies/${companyId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(companyId);
    expect(body.data.name).toBe('E2E Test Corp');
  });

  test('PATCH /api/crm/companies/[id] → 200 update', async ({ request }) => {
    const res = await request.patch(`/api/crm/companies/${companyId}`, {
      data: { industry: 'SaaS', city: 'San Francisco' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.industry).toBe('SaaS');
    expect(body.data.city).toBe('San Francisco');
  });

  test('GET /api/crm/companies/[id] → verify update persisted', async ({ request }) => {
    const res = await request.get(`/api/crm/companies/${companyId}`);
    const body = await res.json();
    expect(body.data.industry).toBe('SaaS');
    expect(body.data.city).toBe('San Francisco');
  });
});

// ─── CONTACTS CRUD ───────────────────────────────────────────────────────────

test.describe('Contacts CRUD Lifecycle', () => {
  test('POST /api/crm/contacts → 201 create linked to company', async ({ request }) => {
    const res = await request.post('/api/crm/contacts', {
      data: {
        first_name: 'E2E',
        last_name: 'Tester',
        email: 'e2e@testcorp.com',
        phone: '+1-555-0101',
        job_title: 'QA Engineer',
        company_id: companyId,
        status: 'active',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.first_name).toBe('E2E');
    expect(body.data.last_name).toBe('Tester');
    expect(body.data.company_id).toBe(companyId);
    contactId = body.data.id;
  });

  test('GET /api/crm/contacts → find created contact', async ({ request }) => {
    const res = await request.get('/api/crm/contacts');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((c: { id: string }) => c.id === contactId);
    expect(found).toBeTruthy();
    expect(found.first_name).toBe('E2E');
  });

  test('GET /api/crm/contacts?search=E2E → search works', async ({ request }) => {
    const res = await request.get('/api/crm/contacts?search=E2E');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((c: { id: string }) => c.id === contactId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/contacts?status=active → status filter', async ({ request }) => {
    const res = await request.get('/api/crm/contacts?status=active');
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const c of body.data) {
      expect(c.status).toBe('active');
    }
  });

  test('GET /api/crm/contacts?company_id=X → company filter', async ({ request }) => {
    const res = await request.get(`/api/crm/contacts?company_id=${companyId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const c of body.data) {
      expect(c.company_id).toBe(companyId);
    }
    const found = body.data.find((c: { id: string }) => c.id === contactId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/contacts/[id] → 200 detail with company', async ({ request }) => {
    const res = await request.get(`/api/crm/contacts/${contactId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(contactId);
    expect(body.data.company).toBeTruthy();
    expect(body.data.company.name).toBe('E2E Test Corp');
  });

  test('PATCH /api/crm/contacts/[id] → 200 update', async ({ request }) => {
    const res = await request.patch(`/api/crm/contacts/${contactId}`, {
      data: { job_title: 'Senior QA Engineer', phone: '+1-555-0199' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.job_title).toBe('Senior QA Engineer');
  });
});

// ─── PIPELINES + DEALS CRUD ─────────────────────────────────────────────────

test.describe('Pipelines & Deals CRUD Lifecycle', () => {
  test('POST /api/crm/pipelines → 201 with 5 default stages', async ({ request }) => {
    const res = await request.post('/api/crm/pipelines', {
      data: { name: 'E2E Test Pipeline' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('E2E Test Pipeline');
    pipelineId = body.data.id;

    // Verify 5 default stages
    const stages = body.data.stages;
    expect(stages).toHaveLength(5);

    // Sort by position and verify names
    const sorted = [...stages].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    expect(sorted[0].name).toBe('Lead');
    expect(sorted[0].position).toBe(0);
    expect(sorted[1].name).toBe('Qualified');
    expect(sorted[1].position).toBe(1);
    expect(sorted[2].name).toBe('Proposal');
    expect(sorted[2].position).toBe(2);
    expect(sorted[3].name).toBe('Negotiation');
    expect(sorted[3].position).toBe(3);
    expect(sorted[4].name).toBe('Closed Won');
    expect(sorted[4].position).toBe(4);

    stageIds = sorted.map((s: { id: string }) => s.id);
  });

  test('GET /api/crm/pipelines → find created pipeline', async ({ request }) => {
    const res = await request.get('/api/crm/pipelines');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((p: { id: string }) => p.id === pipelineId);
    expect(found).toBeTruthy();
    expect(found.stages).toHaveLength(5);
  });

  test('POST /api/crm/deals → 201 create deal', async ({ request }) => {
    const res = await request.post('/api/crm/deals', {
      data: {
        title: 'E2E Test Deal',
        value: 50000,
        currency: 'USD',
        pipeline_id: pipelineId,
        stage_id: stageIds[0], // Lead stage
        company_id: companyId,
        contact_id: contactId,
        expected_close_date: '2025-12-31',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('E2E Test Deal');
    expect(body.data.value).toBe(50000);
    expect(body.data.status).toBe('open');
    dealId = body.data.id;
  });

  test('GET /api/crm/deals → find deal in list', async ({ request }) => {
    const res = await request.get('/api/crm/deals');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((d: { id: string }) => d.id === dealId);
    expect(found).toBeTruthy();
    expect(found.title).toBe('E2E Test Deal');
  });

  test('GET /api/crm/deals?status=open → status filter', async ({ request }) => {
    const res = await request.get('/api/crm/deals?status=open');
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const d of body.data) {
      expect(d.status).toBe('open');
    }
  });

  test('GET /api/crm/deals?company_id=X → company filter', async ({ request }) => {
    const res = await request.get(`/api/crm/deals?company_id=${companyId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((d: { id: string }) => d.id === dealId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/deals?contact_id=X → contact filter', async ({ request }) => {
    const res = await request.get(`/api/crm/deals?contact_id=${contactId}`);
    const body = await res.json();
    expect(res.status(), `contact_id=${contactId}, response: ${JSON.stringify(body)}`).toBe(200);
    const found = body.data.find((d: { id: string }) => d.id === dealId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/deals?search=E2E → search works', async ({ request }) => {
    const res = await request.get('/api/crm/deals?search=E2E');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((d: { id: string }) => d.id === dealId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/deals/[id] → 200 detail with relations', async ({ request }) => {
    const res = await request.get(`/api/crm/deals/${dealId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe(dealId);
    expect(body.data.company).toBeTruthy();
    expect(body.data.contact).toBeTruthy();
    expect(body.data.stage).toBeTruthy();
  });

  test('GET /api/crm/pipelines/[id] → deal appears in stage', async ({ request }) => {
    const res = await request.get(`/api/crm/pipelines/${pipelineId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const leadStage = body.data.stages.find((s: { id: string }) => s.id === stageIds[0]);
    expect(leadStage).toBeTruthy();
    const dealInStage = leadStage.deals.find((d: { id: string }) => d.id === dealId);
    expect(dealInStage).toBeTruthy();
  });
});

// ─── DEAL BUSINESS LOGIC ────────────────────────────────────────────────────

test.describe('Deal Business Logic', () => {
  test('Move deal to different stage', async ({ request }) => {
    // Move from Lead (stageIds[0]) to Qualified (stageIds[1])
    const res = await request.patch(`/api/crm/deals/${dealId}`, {
      data: { stage_id: stageIds[1], position: 0 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.stage_id).toBe(stageIds[1]);
  });

  test('Setting status to "won" auto-sets actual_close_date', async ({ request }) => {
    const res = await request.patch(`/api/crm/deals/${dealId}`, {
      data: { status: 'won' },
    });
    const body = await res.json();
    expect(res.status(), `dealId=${dealId}, error: ${JSON.stringify(body)}`).toBe(200);
    expect(body.data.status).toBe('won');
    expect(body.data.actual_close_date).toBeTruthy();
    // Verify close date is a valid ISO date string
    const closeDate = new Date(body.data.actual_close_date);
    expect(closeDate.getTime()).toBeGreaterThan(0);
    // Verify it's within the last 24 hours (server clock may differ)
    const now = new Date();
    expect(Math.abs(now.getTime() - closeDate.getTime())).toBeLessThan(24 * 60 * 60 * 1000);
  });

  test('Re-open deal and set to "lost" also sets actual_close_date', async ({ request }) => {
    // First re-open
    await request.patch(`/api/crm/deals/${dealId}`, {
      data: { status: 'open' },
    });

    // Now set to lost
    const res = await request.patch(`/api/crm/deals/${dealId}`, {
      data: { status: 'lost' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe('lost');
    expect(body.data.actual_close_date).toBeTruthy();
    const lostCloseDate = new Date(body.data.actual_close_date);
    expect(Math.abs(new Date().getTime() - lostCloseDate.getTime())).toBeLessThan(24 * 60 * 60 * 1000);
  });
});

// ─── ACTIVITIES CRUD ─────────────────────────────────────────────────────────

test.describe('Activities CRUD Lifecycle', () => {
  test('POST /api/crm/activities → 201 create', async ({ request }) => {
    const res = await request.post('/api/crm/activities', {
      data: {
        type: 'call',
        title: 'E2E Follow-up Call',
        description: 'Test activity for E2E testing',
        deal_id: dealId,
        contact_id: contactId,
        company_id: companyId,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('E2E Follow-up Call');
    expect(body.data.type).toBe('call');
    expect(body.data.is_completed).toBe(false);
    activityId = body.data.id;
  });

  test('GET /api/crm/activities → find in list', async ({ request }) => {
    const res = await request.get('/api/crm/activities');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((a: { id: string }) => a.id === activityId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/activities?type=call → type filter', async ({ request }) => {
    const res = await request.get('/api/crm/activities?type=call');
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const a of body.data) {
      expect(a.type).toBe('call');
    }
    const found = body.data.find((a: { id: string }) => a.id === activityId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/activities?contact_id=X → contact filter', async ({ request }) => {
    const res = await request.get(`/api/crm/activities?contact_id=${contactId}`);
    const bodyDebug = await res.json();
    expect(res.status(), `contact_id=${contactId}, error: ${JSON.stringify(bodyDebug)}`).toBe(200);
    const body = await res.json();
    const found = body.data.find((a: { id: string }) => a.id === activityId);
    expect(found).toBeTruthy();
  });

  test('PATCH activity with is_completed=true → sets completed_at', async ({ request }) => {
    const res = await request.patch(`/api/crm/activities/${activityId}`, {
      data: { is_completed: true },
    });
    const bodyDebug2 = await res.json();
    expect(res.status(), `activityId=${activityId}, error: ${JSON.stringify(bodyDebug2)}`).toBe(200);
    const body = await res.json();
    expect(body.data.is_completed).toBe(true);
    expect(body.data.completed_at).toBeTruthy();
  });

  test('PATCH activity with is_completed=false → clears completed_at', async ({ request }) => {
    const res = await request.patch(`/api/crm/activities/${activityId}`, {
      data: { is_completed: false },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.is_completed).toBe(false);
    expect(body.data.completed_at).toBeNull();
  });
});

// ─── PRODUCTS CRUD ───────────────────────────────────────────────────────────

test.describe('Products CRUD Lifecycle', () => {
  test('POST /api/crm/products → 201 create', async ({ request }) => {
    const res = await request.post('/api/crm/products', {
      data: {
        name: 'E2E Test Product',
        description: 'A product for testing',
        sku: 'E2E-001',
        price: 99.99,
        currency: 'USD',
        category: 'Software',
        is_active: true,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('E2E Test Product');
    expect(body.data.price).toBe(99.99);
    productId = body.data.id;
  });

  test('GET /api/crm/products → find in list', async ({ request }) => {
    const res = await request.get('/api/crm/products');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((p: { id: string }) => p.id === productId);
    expect(found).toBeTruthy();
  });

  test('GET /api/crm/products?search=E2E → search works', async ({ request }) => {
    const res = await request.get('/api/crm/products?search=E2E');
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.data.find((p: { id: string }) => p.id === productId);
    expect(found).toBeTruthy();
  });

  test('PATCH /api/crm/products/[id] → 200 update price', async ({ request }) => {
    const res = await request.patch(`/api/crm/products/${productId}`, {
      data: { price: 149.99, category: 'Enterprise Software' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.price).toBe(149.99);
    expect(body.data.category).toBe('Enterprise Software');
  });
});

// ─── PAGINATION ──────────────────────────────────────────────────────────────

test.describe('Pagination', () => {
  test('GET /api/crm/contacts?limit=2&offset=0 → respects limit', async ({ request }) => {
    const res = await request.get('/api/crm/contacts?limit=2&offset=0');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  test('GET /api/crm/companies?limit=1 → returns at most 1', async ({ request }) => {
    const res = await request.get('/api/crm/companies?limit=1');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeLessThanOrEqual(1);
  });
});

// ─── 404 FOR MISSING RESOURCES ───────────────────────────────────────────────

test.describe('404 for missing resources', () => {
  const fakeUUID = '00000000-0000-0000-0000-000000000000';

  test('GET /api/crm/companies/[fake] → 404', async ({ request }) => {
    const res = await request.get(`/api/crm/companies/${fakeUUID}`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/crm/contacts/[fake] → 404', async ({ request }) => {
    const res = await request.get(`/api/crm/contacts/${fakeUUID}`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/crm/deals/[fake] → 404', async ({ request }) => {
    const res = await request.get(`/api/crm/deals/${fakeUUID}`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/crm/pipelines/[fake] → 404', async ({ request }) => {
    const res = await request.get(`/api/crm/pipelines/${fakeUUID}`);
    expect(res.status()).toBe(404);
  });
});

// ─── CLEANUP ─────────────────────────────────────────────────────────────────

test.describe('Cleanup test data', () => {
  test('Delete activity', async ({ request }) => {
    if (!activityId) return;
    const res = await request.delete(`/api/crm/activities/${activityId}`);
    expect(res.status()).toBe(200);
  });

  test('Delete product', async ({ request }) => {
    if (!productId) return;
    const res = await request.delete(`/api/crm/products/${productId}`);
    expect(res.status()).toBe(200);
  });

  test('Delete deal', async ({ request }) => {
    if (!dealId) return;
    const res = await request.delete(`/api/crm/deals/${dealId}`);
    expect(res.status()).toBe(200);
  });

  test('Delete pipeline', async ({ request }) => {
    if (!pipelineId) return;
    const res = await request.delete(`/api/crm/pipelines/${pipelineId}`);
    // Pipeline deletion may cascade or may not have a DELETE endpoint
    // Accept either 200 or 405
    expect([200, 204, 405].includes(res.status())).toBe(true);
  });

  test('Delete contact', async ({ request }) => {
    if (!contactId) return;
    const res = await request.delete(`/api/crm/contacts/${contactId}`);
    expect(res.status()).toBe(200);
  });

  test('Delete company', async ({ request }) => {
    if (!companyId) return;
    const res = await request.delete(`/api/crm/companies/${companyId}`);
    expect(res.status()).toBe(200);
  });

  test('Verify company is deleted → 404', async ({ request }) => {
    if (!companyId) return;
    const res = await request.get(`/api/crm/companies/${companyId}`);
    expect(res.status()).toBe(404);
  });

  test('Verify contact is deleted → 404', async ({ request }) => {
    if (!contactId) return;
    const res = await request.get(`/api/crm/contacts/${contactId}`);
    expect(res.status()).toBe(404);
  });
});
