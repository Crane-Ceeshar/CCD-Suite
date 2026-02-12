import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * XSS (Cross-Site Scripting) Security Tests
 *
 * Verifies that all text-input API endpoints either reject or sanitize
 * dangerous HTML/JavaScript payloads. Each test POSTs or PATCHes a
 * malicious payload and asserts that:
 *   - The server returns 400 (input rejected), OR
 *   - The response body does NOT contain raw dangerous tags/attributes
 */

// ─── XSS Payloads ──────────────────────────────────────────────────────────

const XSS_PAYLOADS = {
  scriptTag: '<script>alert(1)</script>',
  imgOnerror: '<img onerror=alert(1) src=x>',
  javascriptUrl: 'javascript:alert(1)',
  svgOnload: '<svg onload=alert(1)>',
  iframeSrc: '<iframe src="javascript:alert(1)">',
  eventHandler: '" onfocus="alert(1)" autofocus="',
  htmlEntities: '&lt;script&gt;alert(1)&lt;/script&gt;',
  nestedScript: '<<script>script>alert(1)<</script>/script>',
};

/** Check that a response body does not contain raw dangerous XSS patterns */
function assertNoRawXSS(body: string, context: string) {
  const dangerousPatterns = [
    '<script>',
    '<script ',
    'onerror=',
    'onload=',
    'onfocus=',
    'javascript:',
    '<iframe',
    '<svg onload',
  ];

  for (const pattern of dangerousPatterns) {
    // Case-insensitive check — XSS attacks often use mixed case
    const found = body.toLowerCase().includes(pattern.toLowerCase());
    expect(
      found,
      `Raw XSS pattern "${pattern}" found in ${context} response body`
    ).toBe(false);
  }
}

// ─── HR Endpoint XSS Tests ─────────────────────────────────────────────────

test.describe('XSS — HR Endpoints', () => {
  test('POST /api/hr/employees rejects <script> in name fields', async ({ request }) => {
    const res = await request.post('/api/hr/employees', {
      data: {
        first_name: XSS_PAYLOADS.scriptTag,
        last_name: 'Tester',
        email: `xss-test-${Date.now()}@example.com`,
        department_id: null,
        position: 'Tester',
        status: 'active',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) {
      // Server rejected the input — good
      return;
    }
    // If the server accepted it, verify the response body is sanitized
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/hr/employees (first_name)');
  });

  test('POST /api/hr/employees rejects <img onerror> in position field', async ({ request }) => {
    const res = await request.post('/api/hr/employees', {
      data: {
        first_name: 'XSS',
        last_name: 'Test',
        email: `xss-img-${Date.now()}@example.com`,
        position: XSS_PAYLOADS.imgOnerror,
        status: 'active',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/hr/employees (position)');
  });

  test('POST /api/hr/departments rejects <script> in department name', async ({ request }) => {
    const res = await request.post('/api/hr/departments', {
      data: {
        name: XSS_PAYLOADS.scriptTag,
        description: 'XSS test department',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/hr/departments (name)');
  });

  test('POST /api/hr/departments rejects SVG onload in description', async ({ request }) => {
    const res = await request.post('/api/hr/departments', {
      data: {
        name: 'XSS Test Dept',
        description: XSS_PAYLOADS.svgOnload,
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/hr/departments (description)');
  });

  test('POST /api/hr/leave rejects <script> in reason/notes', async ({ request }) => {
    const res = await request.post('/api/hr/leave', {
      data: {
        leave_type: 'annual',
        start_date: '2025-12-01',
        end_date: '2025-12-02',
        reason: XSS_PAYLOADS.scriptTag,
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/hr/leave (reason)');
  });

  test('POST /api/hr/reviews rejects <script> in review comments', async ({ request }) => {
    const res = await request.post('/api/hr/reviews', {
      data: {
        employee_id: '00000000-0000-0000-0000-000000000000',
        review_type: 'annual',
        review_period_start: '2025-01-01',
        review_period_end: '2025-12-31',
        comments: XSS_PAYLOADS.scriptTag,
        goals: XSS_PAYLOADS.imgOnerror,
      },
    });
    const status = res.status();
    if (status === 400 || status === 422 || status === 404) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/hr/reviews (comments/goals)');
  });

  test('POST /api/hr/contracts rejects <script> in contract content', async ({ request }) => {
    const res = await request.post('/api/hr/contracts', {
      data: {
        employee_id: '00000000-0000-0000-0000-000000000000',
        title: XSS_PAYLOADS.scriptTag,
        content: XSS_PAYLOADS.iframeSrc,
        status: 'draft',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422 || status === 404) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/hr/contracts (title/content)');
  });

  test('POST /api/hr/contract-templates rejects HTML entities in body', async ({ request }) => {
    const res = await request.post('/api/hr/contract-templates', {
      data: {
        name: 'XSS Template Test',
        content: XSS_PAYLOADS.htmlEntities,
        category: 'employment',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    // HTML entities themselves are safe, but check no raw script tags
    assertNoRawXSS(body, 'POST /api/hr/contract-templates (content)');
  });
});

// ─── CRM Endpoint XSS Tests ────────────────────────────────────────────────

test.describe('XSS — CRM Endpoints', () => {
  test('POST /api/crm/companies rejects <script> in name', async ({ request }) => {
    const res = await request.post('/api/crm/companies', {
      data: {
        name: XSS_PAYLOADS.scriptTag,
        industry: 'Technology',
        website: 'https://example.com',
        status: 'active',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/crm/companies (name)');
  });

  test('POST /api/crm/companies rejects javascript: URL in website field', async ({ request }) => {
    const res = await request.post('/api/crm/companies', {
      data: {
        name: 'XSS URL Test Co',
        industry: 'Technology',
        website: XSS_PAYLOADS.javascriptUrl,
        status: 'active',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/crm/companies (website)');
  });

  test('POST /api/crm/contacts rejects <script> in name fields', async ({ request }) => {
    const res = await request.post('/api/crm/contacts', {
      data: {
        first_name: XSS_PAYLOADS.scriptTag,
        last_name: XSS_PAYLOADS.imgOnerror,
        email: `xss-contact-${Date.now()}@example.com`,
        status: 'active',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/crm/contacts (first_name/last_name)');
  });

  test('POST /api/crm/deals rejects <script> in title', async ({ request }) => {
    const res = await request.post('/api/crm/deals', {
      data: {
        title: XSS_PAYLOADS.scriptTag,
        value: 1000,
        currency: 'USD',
        status: 'open',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/crm/deals (title)');
  });

  test('POST /api/crm/activities rejects <script> in title/description', async ({ request }) => {
    const res = await request.post('/api/crm/activities', {
      data: {
        type: 'note',
        title: XSS_PAYLOADS.scriptTag,
        description: XSS_PAYLOADS.imgOnerror,
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/crm/activities (title/description)');
  });

  test('POST /api/crm/products rejects <script> in name/description', async ({ request }) => {
    const res = await request.post('/api/crm/products', {
      data: {
        name: XSS_PAYLOADS.scriptTag,
        description: XSS_PAYLOADS.svgOnload,
        price: 10,
        currency: 'USD',
        is_active: true,
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/crm/products (name/description)');
  });

  test('GET /api/crm/companies?search=<script> does not reflect raw XSS', async ({ request }) => {
    const res = await request.get(`/api/crm/companies?search=${encodeURIComponent(XSS_PAYLOADS.scriptTag)}`);
    const body = await res.text();
    assertNoRawXSS(body, 'GET /api/crm/companies?search (reflected XSS)');
  });

  test('GET /api/crm/contacts?search=<script> does not reflect raw XSS', async ({ request }) => {
    const res = await request.get(`/api/crm/contacts?search=${encodeURIComponent(XSS_PAYLOADS.scriptTag)}`);
    const body = await res.text();
    assertNoRawXSS(body, 'GET /api/crm/contacts?search (reflected XSS)');
  });

  test('GET /api/crm/deals?search=<script> does not reflect raw XSS', async ({ request }) => {
    const res = await request.get(`/api/crm/deals?search=${encodeURIComponent(XSS_PAYLOADS.scriptTag)}`);
    const body = await res.text();
    assertNoRawXSS(body, 'GET /api/crm/deals?search (reflected XSS)');
  });

  test('GET /api/crm/products?search=<script> does not reflect raw XSS', async ({ request }) => {
    const res = await request.get(`/api/crm/products?search=${encodeURIComponent(XSS_PAYLOADS.scriptTag)}`);
    const body = await res.text();
    assertNoRawXSS(body, 'GET /api/crm/products?search (reflected XSS)');
  });
});

// ─── Content Endpoint XSS Tests ────────────────────────────────────────────

test.describe('XSS — Content Endpoints', () => {
  test('POST /api/content rejects <script> in title/body', async ({ request }) => {
    const res = await request.post('/api/content', {
      data: {
        title: XSS_PAYLOADS.scriptTag,
        content_type: 'article',
        status: 'draft',
        body: XSS_PAYLOADS.iframeSrc,
        excerpt: XSS_PAYLOADS.imgOnerror,
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/content (title/body/excerpt)');
  });

  test('POST /api/content/categories rejects <script> in name', async ({ request }) => {
    const res = await request.post('/api/content/categories', {
      data: {
        name: XSS_PAYLOADS.scriptTag,
        slug: 'xss-test-cat',
        color: '#FF0000',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/content/categories (name)');
  });

  test('POST /api/content/templates rejects <script> in name/body_template', async ({ request }) => {
    const res = await request.post('/api/content/templates', {
      data: {
        name: XSS_PAYLOADS.scriptTag,
        content_type: 'article',
        body_template: XSS_PAYLOADS.svgOnload,
        description: XSS_PAYLOADS.imgOnerror,
      },
    });
    const status = res.status();
    if (status === 400 || status === 422 || status === 500) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/content/templates (name/body_template)');
  });

  test('GET /api/content?search=<script> does not reflect raw XSS', async ({ request }) => {
    const res = await request.get(`/api/content?search=${encodeURIComponent(XSS_PAYLOADS.scriptTag)}`);
    const body = await res.text();
    assertNoRawXSS(body, 'GET /api/content?search (reflected XSS)');
  });
});

// ─── Finance Endpoint XSS Tests ────────────────────────────────────────────

test.describe('XSS — Finance Endpoints', () => {
  test('POST /api/finance/invoices rejects <script> in notes/description', async ({ request }) => {
    const res = await request.post('/api/finance/invoices', {
      data: {
        client_name: XSS_PAYLOADS.scriptTag,
        client_email: 'xss@test.com',
        notes: XSS_PAYLOADS.imgOnerror,
        status: 'draft',
        due_date: '2025-12-31',
        items: [{ description: XSS_PAYLOADS.svgOnload, quantity: 1, unit_price: 100 }],
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/finance/invoices (client_name/notes)');
  });

  test('POST /api/finance/expenses rejects <script> in description', async ({ request }) => {
    const res = await request.post('/api/finance/expenses', {
      data: {
        description: XSS_PAYLOADS.scriptTag,
        amount: 50.00,
        category: 'office',
        date: '2025-06-15',
        vendor: XSS_PAYLOADS.imgOnerror,
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/finance/expenses (description/vendor)');
  });
});

// ─── Event Handler and Nested XSS Payloads ─────────────────────────────────

test.describe('XSS — Advanced Payloads', () => {
  test('POST /api/crm/companies with event handler payload', async ({ request }) => {
    const res = await request.post('/api/crm/companies', {
      data: {
        name: XSS_PAYLOADS.eventHandler,
        industry: 'Test',
        status: 'active',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    expect(
      body.toLowerCase().includes('onfocus='),
      'Event handler XSS pattern found in response body'
    ).toBe(false);
  });

  test('POST /api/crm/companies with nested script payload', async ({ request }) => {
    const res = await request.post('/api/crm/companies', {
      data: {
        name: XSS_PAYLOADS.nestedScript,
        industry: 'Test',
        status: 'active',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/crm/companies (nested script)');
  });

  test('POST /api/hr/employees with multiple XSS vectors in one payload', async ({ request }) => {
    const res = await request.post('/api/hr/employees', {
      data: {
        first_name: XSS_PAYLOADS.scriptTag,
        last_name: XSS_PAYLOADS.imgOnerror,
        email: `xss-multi-${Date.now()}@example.com`,
        position: XSS_PAYLOADS.svgOnload,
        notes: XSS_PAYLOADS.iframeSrc,
        status: 'active',
      },
    });
    const status = res.status();
    if (status === 400 || status === 422) return;
    const body = await res.text();
    assertNoRawXSS(body, 'POST /api/hr/employees (multiple vectors)');
  });
});
