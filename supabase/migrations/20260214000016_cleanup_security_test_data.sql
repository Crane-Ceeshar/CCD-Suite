-- ============================================================================
-- Cleanup: Remove data created by automated security tests
--
-- The security test suite (apps/web/tests/security/) ran against the
-- production database and left behind XSS payloads, SQL injection test
-- strings, rate-limit flood records, and tenant isolation test data.
-- This migration removes all identifiable test records.
-- ============================================================================

BEGIN;

-- ─── Contacts ────────────────────────────────────────────────────────────────
-- XSS test contacts (email pattern: xss-contact-*, xss-test-*, xss-img-*, xss-multi-*)
-- SQL injection test contacts (email pattern: sqli-contact-*, sqli-paren-*, sqli-test-*)
DELETE FROM public.contacts
WHERE email LIKE 'xss-contact-%@example.com'
   OR email LIKE 'xss-test-%@example.com'
   OR email LIKE 'xss-img-%@example.com'
   OR email LIKE 'xss-multi-%@example.com'
   OR email LIKE 'sqli-contact-%@example.com'
   OR email LIKE 'sqli-paren-%@example.com'
   OR email LIKE 'sqli-test-%@example.com';

-- ─── Companies ───────────────────────────────────────────────────────────────
-- Rate limit flood companies
DELETE FROM public.companies
WHERE name LIKE 'RateLimit Test Co %';

-- XSS test companies
DELETE FROM public.companies
WHERE name IN (
  '<script>alert(1)</script>',
  'XSS URL Test Co',
  '<<script>script>alert(1)<</script>/script>'
)
OR name LIKE '%alert(1)%'
OR name LIKE '%" autofocus=%'
OR name LIKE '%<img onerror=%'
OR name LIKE '%<svg onload=%';

-- SQL injection test companies
DELETE FROM public.companies
WHERE name IN (
  'Tenant Bypass Test Co'
)
OR name LIKE '%''; DROP TABLE %'
OR name LIKE '%''; INSERT INTO %'
OR name LIKE '%''; SELECT pg_sleep%'
OR name LIKE '%" OR ""%'
OR name LIKE '%UNION SELECT%';

-- ─── Deals ───────────────────────────────────────────────────────────────────
DELETE FROM public.deals
WHERE title LIKE '%<script>%'
   OR title LIKE '%alert(1)%'
   OR title LIKE '%onerror=%';

-- ─── Activities ──────────────────────────────────────────────────────────────
DELETE FROM public.activities
WHERE title LIKE '%<script>%'
   OR title LIKE '%alert(1)%'
   OR description LIKE '%<img onerror=%';

-- ─── Products ────────────────────────────────────────────────────────────────
DELETE FROM public.products
WHERE name LIKE '%<script>%'
   OR name LIKE '%alert(1)%'
   OR description LIKE '%<svg onload=%';

-- ─── HR: Employees ──────────────────────────────────────────────────────────
DELETE FROM public.employees
WHERE email LIKE 'xss-test-%@example.com'
   OR email LIKE 'xss-img-%@example.com'
   OR email LIKE 'xss-multi-%@example.com'
   OR email LIKE 'sqli-test-%@example.com'
   OR first_name LIKE '%<script>%'
   OR first_name LIKE '%alert(1)%'
   OR first_name LIKE '%'' OR 1=1%'
   OR first_name LIKE '%'' OR (''1''=''1%';

-- ─── HR: Departments ────────────────────────────────────────────────────────
DELETE FROM public.departments
WHERE name LIKE '%<script>%'
   OR name LIKE '%alert(1)%'
   OR name LIKE 'XSS Test Dept'
   OR name LIKE '%''; INSERT INTO %'
   OR description LIKE '%<svg onload=%'
   OR description LIKE '%UNION SELECT%';

-- ─── HR: Leave Requests ─────────────────────────────────────────────────────
DELETE FROM public.leave_requests
WHERE reason LIKE '%<script>%'
   OR reason LIKE '%alert(1)%';

-- ─── HR: Performance Reviews ─────────────────────────────────────────────────
DELETE FROM public.performance_reviews
WHERE overall_comments LIKE '%<script>%'
   OR overall_comments LIKE '%alert(1)%'
   OR goals LIKE '%<img onerror=%';

-- ─── HR: Contracts ──────────────────────────────────────────────────────────
DELETE FROM public.contracts
WHERE title LIKE '%<script>%'
   OR content::text LIKE '%<iframe src="javascript:%';

-- ─── HR: Contract Templates ─────────────────────────────────────────────────
DELETE FROM public.contract_templates
WHERE name = 'XSS Template Test'
   OR content::text LIKE '%&lt;script&gt;%';

-- ─── Content ─────────────────────────────────────────────────────────────────
DELETE FROM public.content_items
WHERE title LIKE '%<script>%'
   OR title LIKE '%''; INSERT INTO %'
   OR body LIKE '%<iframe src="javascript:%'
   OR body LIKE '%UNION SELECT%'
   OR excerpt LIKE '%<img onerror=%'
   OR excerpt LIKE '%'' OR 1=1%';

-- ─── Content: Categories ─────────────────────────────────────────────────────
DELETE FROM public.content_categories
WHERE slug = 'xss-test-cat'
   OR name LIKE '%<script>%';

-- ─── Content: Templates ──────────────────────────────────────────────────────
DELETE FROM public.content_templates
WHERE name LIKE '%<script>%'
   OR body_template LIKE '%<svg onload=%'
   OR description LIKE '%<img onerror=%';

-- ─── Finance: Invoices ───────────────────────────────────────────────────────
-- The invoices table uses contact_id/company_id refs, not client_name/client_email.
-- Security tests POSTed those fields; clean up any that got stored in notes/metadata.
DELETE FROM public.invoices
WHERE notes LIKE '%<img onerror=%'
   OR notes LIKE '%<script>%'
   OR notes LIKE '%UNION SELECT%'
   OR metadata::text LIKE '%<script>%'
   OR metadata::text LIKE '%alert(1)%';

-- ─── Finance: Expenses ───────────────────────────────────────────────────────
-- category has a CHECK constraint so SQL payloads would be rejected there.
DELETE FROM public.expenses
WHERE description LIKE '%<script>%'
   OR description LIKE '%''; DROP TABLE %'
   OR vendor LIKE '%<img onerror=%';

COMMIT;
