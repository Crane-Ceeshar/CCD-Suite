-- ============================================================================
-- Cleanup: Remove remaining E2E and UI test data
--
-- Previous cleanups (000016, 000017) removed XSS/SQLi/CSRF/rate-limit
-- test records. This catches all remaining E2E integration and UI test
-- records created by crm-api.spec.ts, crm-ui.spec.ts, and analytics-ui.spec.ts.
-- ============================================================================

BEGIN;

-- ─── Contacts: E2E API + UI test records ─────────────────────────────────────
DELETE FROM public.contacts
WHERE email IN ('e2e@testcorp.com', 'e2e-contact-updated@testcorp.com', 'uitest@e2e.com', 'updated-uitest@e2e.com');

-- ─── Companies: E2E API + UI test records ────────────────────────────────────
DELETE FROM public.companies
WHERE name IN ('E2E Test Corp', 'E2E Test Corp Updated', 'UITestCorp');

-- ─── Deals: E2E API + UI test records ────────────────────────────────────────
DELETE FROM public.deals
WHERE title IN ('E2E Test Deal', 'E2E Test Deal Updated', 'UITestDeal');

-- ─── Activities: E2E test records ────────────────────────────────────────────
DELETE FROM public.activities
WHERE title IN ('E2E Follow-up Call', 'E2E Follow-up Call Updated', 'E2E Activity', 'E2E Activity Updated');

-- ─── Products: E2E test records ──────────────────────────────────────────────
DELETE FROM public.products
WHERE name IN ('E2E Test Product', 'E2E Test Product Updated')
   OR sku = 'E2E-001';

-- ─── Pipelines: E2E test records ─────────────────────────────────────────────
DELETE FROM public.pipelines
WHERE name IN ('E2E Test Pipeline', 'E2E Test Pipeline Updated');

-- ─── Analytics: E2E UI test records ──────────────────────────────────────────
-- Dashboard created by analytics-ui.spec.ts
DELETE FROM public.analytics_reports
WHERE name = 'E2E Test Dashboard';

COMMIT;
