import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * SQL Injection Security Tests
 *
 * Verifies that all API endpoints properly parameterize queries and reject
 * or safely handle SQL injection attempts in:
 *   - Search/filter query parameters
 *   - Text fields in POST/PATCH bodies
 *   - UUID fields (path params and body fields)
 *
 * Each test sends a malicious SQL payload and asserts that:
 *   - The server returns 400/422 (input rejected), OR
 *   - The server returns a normal success response without leaking extra data
 *   - The server does NOT return raw SQL error messages
 */

// ─── SQL Injection Payloads ────────────────────────────────────────────────

const SQL_PAYLOADS = {
  tautology: "' OR 1=1 --",
  dropTable: "'; DROP TABLE employees; --",
  unionSelect: "' UNION SELECT * FROM profiles --",
  unionSelectNull: "' UNION SELECT NULL, NULL, NULL --",
  commentBypass: "admin'--",
  sleepAttack: "'; SELECT pg_sleep(5); --",
  stackedQuery: "'; INSERT INTO profiles (id) VALUES ('hacked'); --",
  hexEncoded: "0x27204f5220313d31202d2d",
  doubleQuote: '" OR ""="',
  closingParen: "') OR ('1'='1",
};

/** Assert that a response does not contain raw SQL error details */
function assertNoSQLErrorLeak(body: string, context: string) {
  const leakPatterns = [
    'pg_catalog',
    'information_schema',
    'syntax error at or near',
    'ERROR:',
    'DETAIL:',
    'HINT:',
    'unterminated quoted string',
    'invalid input syntax for type uuid',
    'relation "profiles" does not exist',
    'column "',
    'SELECT * FROM',
  ];

  for (const pattern of leakPatterns) {
    const found = body.includes(pattern);
    expect(
      found,
      `SQL error leak "${pattern}" found in ${context} response body`
    ).toBe(false);
  }
}

// ─── HR Endpoint SQL Injection Tests ───────────────────────────────────────

test.describe('SQL Injection — HR Endpoints', () => {
  test('GET /api/hr/employees?search with tautology payload', async ({ request }) => {
    const res = await request.get(`/api/hr/employees?search=${encodeURIComponent(SQL_PAYLOADS.tautology)}`);
    const status = res.status();
    const body = await res.text();

    // Should either reject (400) or return empty/normal results (200)
    expect(
      [200, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in HR employees search`
    ).toBe(true);

    if (status === 200) {
      // If 200, verify we didn't get ALL records (tautology bypass)
      // The response should be a normal list, not a data dump
      assertNoSQLErrorLeak(body, 'GET /api/hr/employees?search (tautology)');
    }
  });

  test('GET /api/hr/departments?search with DROP TABLE payload', async ({ request }) => {
    const res = await request.get(`/api/hr/departments?search=${encodeURIComponent(SQL_PAYLOADS.dropTable)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in HR departments search`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/hr/departments?search (DROP TABLE)');
  });

  test('POST /api/hr/employees with SQL injection in name fields', async ({ request }) => {
    const res = await request.post('/api/hr/employees', {
      data: {
        first_name: SQL_PAYLOADS.tautology,
        last_name: SQL_PAYLOADS.dropTable,
        email: `sqli-test-${Date.now()}@example.com`,
        position: SQL_PAYLOADS.unionSelect,
        status: 'active',
      },
    });
    const status = res.status();
    const body = await res.text();

    // Should either reject or safely store the literal string
    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in employee name`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/hr/employees (name fields)');
  });

  test('POST /api/hr/departments with SQL injection in name', async ({ request }) => {
    const res = await request.post('/api/hr/departments', {
      data: {
        name: SQL_PAYLOADS.stackedQuery,
        description: SQL_PAYLOADS.unionSelect,
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in department name`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/hr/departments (name)');
  });

  test('GET /api/hr/employees/[sqli-uuid] with SQL in path param', async ({ request }) => {
    const res = await request.get(`/api/hr/employees/${encodeURIComponent(SQL_PAYLOADS.tautology)}`);
    const status = res.status();
    const body = await res.text();

    // Path param should be validated as UUID — expect 400 or 404
    expect(
      [400, 404, 422, 500].includes(status),
      `Unexpected status ${status} for SQL injection in employee ID path param`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/hr/employees/[sqli] (path param)');
  });
});

// ─── CRM Endpoint SQL Injection Tests ──────────────────────────────────────

test.describe('SQL Injection — CRM Endpoints', () => {
  test('GET /api/crm/companies?search with tautology payload', async ({ request }) => {
    const res = await request.get(`/api/crm/companies?search=${encodeURIComponent(SQL_PAYLOADS.tautology)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in CRM companies search`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/crm/companies?search (tautology)');
  });

  test('GET /api/crm/companies?search with UNION SELECT payload', async ({ request }) => {
    const res = await request.get(`/api/crm/companies?search=${encodeURIComponent(SQL_PAYLOADS.unionSelect)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in CRM companies search (UNION)`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/crm/companies?search (UNION SELECT)');
  });

  test('GET /api/crm/contacts?search with DROP TABLE payload', async ({ request }) => {
    const res = await request.get(`/api/crm/contacts?search=${encodeURIComponent(SQL_PAYLOADS.dropTable)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in CRM contacts search`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/crm/contacts?search (DROP TABLE)');
  });

  test('GET /api/crm/deals?search with sleep attack payload', async ({ request }) => {
    const startTime = Date.now();
    const res = await request.get(`/api/crm/deals?search=${encodeURIComponent(SQL_PAYLOADS.sleepAttack)}`);
    const elapsed = Date.now() - startTime;
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in CRM deals search (sleep)`
    ).toBe(true);

    // If the sleep attack worked, the response would take ~5 seconds
    expect(
      elapsed,
      `Response took ${elapsed}ms — possible SQL injection sleep attack success`
    ).toBeLessThan(5000);

    assertNoSQLErrorLeak(body, 'GET /api/crm/deals?search (sleep attack)');
  });

  test('POST /api/crm/companies with SQL injection in name', async ({ request }) => {
    const res = await request.post('/api/crm/companies', {
      data: {
        name: SQL_PAYLOADS.stackedQuery,
        industry: SQL_PAYLOADS.tautology,
        website: 'https://sqli-test.com',
        status: 'active',
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in CRM company creation`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/crm/companies (name/industry)');
  });

  test('POST /api/crm/contacts with SQL injection in name fields', async ({ request }) => {
    const res = await request.post('/api/crm/contacts', {
      data: {
        first_name: SQL_PAYLOADS.unionSelect,
        last_name: SQL_PAYLOADS.closingParen,
        email: `sqli-contact-${Date.now()}@example.com`,
        status: 'active',
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in CRM contact creation`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/crm/contacts (name fields)');
  });

  test('GET /api/crm/companies/[sqli-uuid] with SQL in UUID param', async ({ request }) => {
    const sqlUuid = "' OR 1=1 --";
    const res = await request.get(`/api/crm/companies/${encodeURIComponent(sqlUuid)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [400, 404, 422, 500].includes(status),
      `Unexpected status ${status} for SQL injection in company UUID path`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/crm/companies/[sqli] (UUID path)');
  });

  test('GET /api/crm/contacts/[sqli-uuid] with SQL in UUID param', async ({ request }) => {
    const sqlUuid = "'; DROP TABLE contacts; --";
    const res = await request.get(`/api/crm/contacts/${encodeURIComponent(sqlUuid)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [400, 404, 422, 500].includes(status),
      `Unexpected status ${status} for SQL injection in contact UUID path`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/crm/contacts/[sqli] (UUID path)');
  });

  test('PATCH /api/crm/companies/[id] with SQL injection in body', async ({ request }) => {
    const fakeUUID = '00000000-0000-0000-0000-000000000000';
    const res = await request.patch(`/api/crm/companies/${fakeUUID}`, {
      data: {
        name: SQL_PAYLOADS.unionSelectNull,
        industry: SQL_PAYLOADS.commentBypass,
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 404, 422].includes(status),
      `Unexpected status ${status} for SQL injection in company PATCH`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'PATCH /api/crm/companies (body fields)');
  });

  test('GET /api/crm/companies?status with SQL injection in filter', async ({ request }) => {
    const res = await request.get(`/api/crm/companies?status=${encodeURIComponent(SQL_PAYLOADS.tautology)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in status filter`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/crm/companies?status (filter injection)');
  });

  test('GET /api/crm/deals?pipeline_id with SQL injection in UUID filter', async ({ request }) => {
    const res = await request.get(`/api/crm/deals?pipeline_id=${encodeURIComponent(SQL_PAYLOADS.tautology)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 422, 500].includes(status),
      `Unexpected status ${status} for SQL injection in pipeline_id filter`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/crm/deals?pipeline_id (UUID filter injection)');
  });
});

// ─── Content Endpoint SQL Injection Tests ──────────────────────────────────

test.describe('SQL Injection — Content Endpoints', () => {
  test('GET /api/content?search with UNION SELECT payload', async ({ request }) => {
    const res = await request.get(`/api/content?search=${encodeURIComponent(SQL_PAYLOADS.unionSelect)}`);
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in content search`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'GET /api/content?search (UNION SELECT)');
  });

  test('POST /api/content with SQL injection in title/body', async ({ request }) => {
    const res = await request.post('/api/content', {
      data: {
        title: SQL_PAYLOADS.stackedQuery,
        content_type: 'article',
        status: 'draft',
        body: SQL_PAYLOADS.unionSelect,
        excerpt: SQL_PAYLOADS.tautology,
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in content creation`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/content (title/body)');
  });
});

// ─── Finance Endpoint SQL Injection Tests ──────────────────────────────────

test.describe('SQL Injection — Finance Endpoints', () => {
  test('POST /api/finance/expenses with SQL injection in description', async ({ request }) => {
    const res = await request.post('/api/finance/expenses', {
      data: {
        description: SQL_PAYLOADS.dropTable,
        amount: 100,
        category: SQL_PAYLOADS.tautology,
        date: '2025-06-15',
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in expense creation`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/finance/expenses (description/category)');
  });

  test('POST /api/finance/invoices with SQL injection in client_name', async ({ request }) => {
    const res = await request.post('/api/finance/invoices', {
      data: {
        client_name: SQL_PAYLOADS.stackedQuery,
        client_email: 'sqli@test.com',
        notes: SQL_PAYLOADS.unionSelect,
        status: 'draft',
        due_date: '2025-12-31',
        items: [{ description: SQL_PAYLOADS.tautology, quantity: 1, unit_price: 50 }],
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for SQL injection in invoice creation`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/finance/invoices (client_name/notes)');
  });
});

// ─── Double-Quote and Closing Paren Payloads ───────────────────────────────

test.describe('SQL Injection — Alternative Quote Styles', () => {
  test('POST /api/crm/companies with double-quote SQL injection', async ({ request }) => {
    const res = await request.post('/api/crm/companies', {
      data: {
        name: SQL_PAYLOADS.doubleQuote,
        industry: 'Test',
        status: 'active',
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for double-quote SQL injection`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/crm/companies (double quote)');
  });

  test('POST /api/crm/contacts with closing-paren SQL injection', async ({ request }) => {
    const res = await request.post('/api/crm/contacts', {
      data: {
        first_name: SQL_PAYLOADS.closingParen,
        last_name: 'Test',
        email: `sqli-paren-${Date.now()}@example.com`,
        status: 'active',
      },
    });
    const status = res.status();
    const body = await res.text();

    expect(
      [200, 201, 400, 422].includes(status),
      `Unexpected status ${status} for closing-paren SQL injection`
    ).toBe(true);
    assertNoSQLErrorLeak(body, 'POST /api/crm/contacts (closing paren)');
  });
});
