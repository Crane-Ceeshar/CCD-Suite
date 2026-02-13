-- ============================================================================
-- Cleanup: Remove remaining test data from CSRF and E2E test suites
--
-- The first cleanup (20260214000016) removed XSS, SQL injection, rate limit,
-- and tenant isolation test records. This migration catches records left by:
--   - csrf.test.ts (CSRF security tests)
--   - crm-api.spec.ts (E2E integration tests)
-- ============================================================================

BEGIN;

-- ─── Companies: CSRF test records ────────────────────────────────────────────
DELETE FROM public.companies
WHERE name = 'CSRF Test Company'
   OR name = 'CSRF Port Test Company'
   OR name = 'CSRF Bad Referer Test'
   OR name LIKE 'CSRF Valid Origin Test %'
   OR name LIKE 'CSRF Referer Test %'
   OR name LIKE 'CSRF No Headers Test %';

-- ─── Companies: E2E test records ─────────────────────────────────────────────
DELETE FROM public.companies
WHERE name = 'E2E Test Corp'
   OR name = 'E2E Test Corp Updated';

-- ─── Companies: SQL injection payloads that slipped through ──────────────────
-- The stacked-query payload: '; profiles (id) VALUES ('hacked')
DELETE FROM public.companies
WHERE name LIKE '%profiles (id) VALUES%'
   OR name LIKE '%'' OR 1=1 --%'
   OR name LIKE 'admin''%';

-- ─── Employees: CSRF test records ────────────────────────────────────────────
DELETE FROM public.employees
WHERE email LIKE 'csrf-test-%@example.com'
   OR (first_name = 'CSRF' AND last_name = 'Test');

-- ─── Expenses: CSRF test records ─────────────────────────────────────────────
-- Note: CSRF test used category 'test' which violates CHECK constraint,
-- so these records likely weren't created. Clean up just in case.
DELETE FROM public.expenses
WHERE description = 'CSRF Test Expense';

-- ─── Contacts: E2E test records ──────────────────────────────────────────────
DELETE FROM public.contacts
WHERE email = 'e2e-contact@e2etest.com'
   OR email = 'e2e-contact-updated@e2etest.com';

-- ─── Deals: E2E test records ─────────────────────────────────────────────────
DELETE FROM public.deals
WHERE title = 'E2E Deal'
   OR title = 'E2E Deal Updated';

-- ─── Activities: E2E test records ────────────────────────────────────────────
DELETE FROM public.activities
WHERE title = 'E2E Activity'
   OR title = 'E2E Activity Updated';

COMMIT;
