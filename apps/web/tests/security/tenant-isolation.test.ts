import { test, expect, APIRequestContext } from '@playwright/test';
import { extractCreatedId } from './cleanup';

/**
 * Tenant Isolation Security Tests
 *
 * Verifies that the multi-tenant RLS (Row Level Security) boundaries
 * cannot be bypassed via:
 *   - Accessing resources with fabricated IDs from another tenant
 *   - Passing tenant_id query params to override isolation
 *   - PATCH/DELETE operations on cross-tenant resource IDs
 *   - Response bodies leaking tenant_id information
 */

// Track created resources for cleanup
const createdCompanyIds: string[] = [];

// A UUID that does not belong to the authenticated user's tenant.
// This simulates a resource belonging to a different organization.
const CROSS_TENANT_UUID = '99999999-9999-9999-9999-999999999999';
const ANOTHER_FAKE_TENANT_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

// ─── Cross-Tenant Resource Access ──────────────────────────────────────────

test.describe('Tenant Isolation — Cross-Tenant Resource Access', () => {
  test('GET /api/crm/companies/[cross-tenant-id] returns 404 not 200', async ({ request }) => {
    const res = await request.get(`/api/crm/companies/${CROSS_TENANT_UUID}`);
    const status = res.status();
    // Must return 404 (not found within this tenant), not 200 or 403
    expect(
      [404].includes(status),
      `Cross-tenant company access returned ${status} instead of 404`
    ).toBe(true);
  });

  test('GET /api/crm/contacts/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.get(`/api/crm/contacts/${CROSS_TENANT_UUID}`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/crm/deals/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.get(`/api/crm/deals/${CROSS_TENANT_UUID}`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/crm/pipelines/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.get(`/api/crm/pipelines/${CROSS_TENANT_UUID}`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/hr/employees/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.get(`/api/hr/employees/${CROSS_TENANT_UUID}`);
    const status = res.status();
    expect(
      [404].includes(status),
      `Cross-tenant employee access returned ${status} instead of 404`
    ).toBe(true);
  });

  test('GET /api/hr/departments/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.get(`/api/hr/departments/${CROSS_TENANT_UUID}`);
    const status = res.status();
    expect(
      [404].includes(status),
      `Cross-tenant department access returned ${status} instead of 404`
    ).toBe(true);
  });

  test('GET /api/finance/invoices/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.get(`/api/finance/invoices/${CROSS_TENANT_UUID}`);
    const status = res.status();
    expect(
      [404].includes(status),
      `Cross-tenant invoice access returned ${status} instead of 404`
    ).toBe(true);
  });

  test('GET /api/finance/expenses/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.get(`/api/finance/expenses/${CROSS_TENANT_UUID}`);
    const status = res.status();
    expect(
      [404].includes(status),
      `Cross-tenant expense access returned ${status} instead of 404`
    ).toBe(true);
  });

  test('GET /api/content/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.get(`/api/content/${CROSS_TENANT_UUID}`);
    const status = res.status();
    expect(
      [404].includes(status),
      `Cross-tenant content access returned ${status} instead of 404`
    ).toBe(true);
  });

  test('GET /api/analytics/dashboards/[cross-tenant-id] returns 404 or error', async ({ request }) => {
    const res = await request.get(`/api/analytics/dashboards/${CROSS_TENANT_UUID}`);
    const status = res.status();
    expect(
      [400, 404].includes(status),
      `Cross-tenant dashboard access returned ${status} instead of 404`
    ).toBe(true);
  });
});

// ─── Cross-Tenant PATCH/DELETE Operations ──────────────────────────────────

test.describe('Tenant Isolation — Cross-Tenant Mutations Return 404', () => {
  test('PATCH /api/crm/companies/[cross-tenant-id] returns 404, not 403', async ({ request }) => {
    const res = await request.patch(`/api/crm/companies/${CROSS_TENANT_UUID}`, {
      data: { name: 'Hacked Company Name' },
    });
    const status = res.status();
    // Must return 404 (resource invisible to this tenant), NOT 403 (which leaks existence)
    expect(
      status,
      `Cross-tenant PATCH returned ${status} — should be 404 to avoid leaking resource existence`
    ).toBe(404);
  });

  test('DELETE /api/crm/companies/[cross-tenant-id] returns 404, not 403', async ({ request }) => {
    const res = await request.delete(`/api/crm/companies/${CROSS_TENANT_UUID}`);
    const status = res.status();
    expect(
      status,
      `Cross-tenant DELETE returned ${status} — should be 404`
    ).toBe(404);
  });

  test('PATCH /api/crm/contacts/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.patch(`/api/crm/contacts/${CROSS_TENANT_UUID}`, {
      data: { first_name: 'Hacked' },
    });
    expect(res.status()).toBe(404);
  });

  test('DELETE /api/crm/contacts/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.delete(`/api/crm/contacts/${CROSS_TENANT_UUID}`);
    expect(res.status()).toBe(404);
  });

  test('PATCH /api/crm/deals/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.patch(`/api/crm/deals/${CROSS_TENANT_UUID}`, {
      data: { title: 'Hacked Deal' },
    });
    expect(res.status()).toBe(404);
  });

  test('DELETE /api/crm/deals/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.delete(`/api/crm/deals/${CROSS_TENANT_UUID}`);
    expect(res.status()).toBe(404);
  });

  test('PATCH /api/crm/activities/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.patch(`/api/crm/activities/${CROSS_TENANT_UUID}`, {
      data: { title: 'Hacked Activity' },
    });
    expect(res.status()).toBe(404);
  });

  test('DELETE /api/crm/activities/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.delete(`/api/crm/activities/${CROSS_TENANT_UUID}`);
    expect(res.status()).toBe(404);
  });

  test('PATCH /api/crm/products/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.patch(`/api/crm/products/${CROSS_TENANT_UUID}`, {
      data: { name: 'Hacked Product' },
    });
    expect(res.status()).toBe(404);
  });

  test('DELETE /api/crm/products/[cross-tenant-id] returns 404', async ({ request }) => {
    const res = await request.delete(`/api/crm/products/${CROSS_TENANT_UUID}`);
    expect(res.status()).toBe(404);
  });
});

// ─── Tenant ID Query Parameter Bypass Attempts ─────────────────────────────

test.describe('Tenant Isolation — Query Param Bypass Attempts', () => {
  test('GET /api/crm/companies?tenant_id=other does not return other tenant data', async ({ request }) => {
    const res = await request.get(`/api/crm/companies?tenant_id=${ANOTHER_FAKE_TENANT_ID}`);
    const status = res.status();
    expect(
      [200, 400].includes(status),
      `Unexpected status ${status} for tenant_id query param bypass`
    ).toBe(true);

    if (status === 200) {
      const body = await res.json();
      // If we get a list, verify none of the items belong to the fake tenant
      if (body.data && Array.isArray(body.data)) {
        for (const item of body.data) {
          if (item.tenant_id) {
            expect(
              item.tenant_id,
              'Response contains data from the injected tenant_id'
            ).not.toBe(ANOTHER_FAKE_TENANT_ID);
          }
        }
      }
    }
  });

  test('GET /api/crm/contacts?tenant_id=other does not bypass isolation', async ({ request }) => {
    const res = await request.get(`/api/crm/contacts?tenant_id=${ANOTHER_FAKE_TENANT_ID}`);
    const status = res.status();
    expect([200, 400].includes(status)).toBe(true);

    if (status === 200) {
      const body = await res.json();
      if (body.data && Array.isArray(body.data)) {
        for (const item of body.data) {
          if (item.tenant_id) {
            expect(item.tenant_id).not.toBe(ANOTHER_FAKE_TENANT_ID);
          }
        }
      }
    }
  });

  test('GET /api/hr/employees?tenant_id=other does not bypass isolation', async ({ request }) => {
    const res = await request.get(`/api/hr/employees?tenant_id=${ANOTHER_FAKE_TENANT_ID}`);
    const status = res.status();
    expect([200, 400].includes(status)).toBe(true);

    if (status === 200) {
      const body = await res.json();
      if (body.data && Array.isArray(body.data)) {
        for (const item of body.data) {
          if (item.tenant_id) {
            expect(item.tenant_id).not.toBe(ANOTHER_FAKE_TENANT_ID);
          }
        }
      }
    }
  });

  test('GET /api/finance/invoices?tenant_id=other does not bypass isolation', async ({ request }) => {
    const res = await request.get(`/api/finance/invoices?tenant_id=${ANOTHER_FAKE_TENANT_ID}`);
    const status = res.status();
    expect([200, 400].includes(status)).toBe(true);

    if (status === 200) {
      const body = await res.json();
      if (body.data && Array.isArray(body.data)) {
        for (const item of body.data) {
          if (item.tenant_id) {
            expect(item.tenant_id).not.toBe(ANOTHER_FAKE_TENANT_ID);
          }
        }
      }
    }
  });

  test('POST /api/crm/companies with tenant_id in body does not override isolation', async ({ request }) => {
    const res = await request.post('/api/crm/companies', {
      data: {
        name: 'Tenant Bypass Test Co',
        tenant_id: ANOTHER_FAKE_TENANT_ID,
        industry: 'Test',
        status: 'active',
      },
    });
    const status = res.status();

    // Track created ID for cleanup
    const id = await extractCreatedId(res);
    if (id) createdCompanyIds.push(id);

    if (status === 201 || status === 200) {
      const body = await res.json();
      // If created, verify the tenant_id was NOT set to the injected value
      if (body.data && body.data.tenant_id) {
        expect(
          body.data.tenant_id,
          'Server allowed tenant_id override via POST body!'
        ).not.toBe(ANOTHER_FAKE_TENANT_ID);
      }
    }
    // 400/422 is also acceptable (server rejected the payload)
  });
});

// ─── Response Body Tenant ID Leak Tests ────────────────────────────────────

test.describe('Tenant Isolation — No Tenant ID Leakage in Responses', () => {
  test('GET /api/crm/companies list does not expose tenant_id', async ({ request }) => {
    const res = await request.get('/api/crm/companies');
    if (res.status() !== 200) return;

    const body = await res.json();
    if (body.data && Array.isArray(body.data) && body.data.length > 0) {
      // Verify tenant_id is not present in the response, or if present,
      // all values are the same (no cross-tenant data leakage)
      const tenantIds = body.data
        .filter((item: Record<string, unknown>) => item.tenant_id)
        .map((item: Record<string, unknown>) => item.tenant_id);

      if (tenantIds.length > 0) {
        const uniqueTenantIds = [...new Set(tenantIds)];
        expect(
          uniqueTenantIds.length,
          'Multiple tenant_ids found in company list — data isolation breach!'
        ).toBe(1);
      }
    }
  });

  test('GET /api/crm/contacts list does not expose cross-tenant data', async ({ request }) => {
    const res = await request.get('/api/crm/contacts');
    if (res.status() !== 200) return;

    const body = await res.json();
    if (body.data && Array.isArray(body.data) && body.data.length > 0) {
      const tenantIds = body.data
        .filter((item: Record<string, unknown>) => item.tenant_id)
        .map((item: Record<string, unknown>) => item.tenant_id);

      if (tenantIds.length > 0) {
        const uniqueTenantIds = [...new Set(tenantIds)];
        expect(
          uniqueTenantIds.length,
          'Multiple tenant_ids found in contacts list — data isolation breach!'
        ).toBe(1);
      }
    }
  });

  test('GET /api/hr/employees list does not expose cross-tenant data', async ({ request }) => {
    const res = await request.get('/api/hr/employees');
    if (res.status() !== 200) return;

    const body = await res.json();
    if (body.data && Array.isArray(body.data) && body.data.length > 0) {
      const tenantIds = body.data
        .filter((item: Record<string, unknown>) => item.tenant_id)
        .map((item: Record<string, unknown>) => item.tenant_id);

      if (tenantIds.length > 0) {
        const uniqueTenantIds = [...new Set(tenantIds)];
        expect(
          uniqueTenantIds.length,
          'Multiple tenant_ids found in employee list — data isolation breach!'
        ).toBe(1);
      }
    }
  });

  test('GET /api/finance/invoices list does not expose cross-tenant data', async ({ request }) => {
    const res = await request.get('/api/finance/invoices');
    if (res.status() !== 200) return;

    const body = await res.json();
    if (body.data && Array.isArray(body.data) && body.data.length > 0) {
      const tenantIds = body.data
        .filter((item: Record<string, unknown>) => item.tenant_id)
        .map((item: Record<string, unknown>) => item.tenant_id);

      if (tenantIds.length > 0) {
        const uniqueTenantIds = [...new Set(tenantIds)];
        expect(
          uniqueTenantIds.length,
          'Multiple tenant_ids found in invoice list — data isolation breach!'
        ).toBe(1);
      }
    }
  });
});

// ─── Cleanup ─────────────────────────────────────────────────────────────────

test.describe('Tenant Isolation — Cleanup', () => {
  test('delete all companies created during tenant isolation tests', async ({ request }) => {
    if (createdCompanyIds.length === 0) return;

    let deleted = 0;
    for (const id of createdCompanyIds) {
      const res = await request.delete(`/api/crm/companies/${id}`);
      if ([200, 204, 404].includes(res.status())) deleted++;
    }
    console.log(`[Cleanup] Deleted ${deleted}/${createdCompanyIds.length} tenant isolation test companies`);
  });
});
