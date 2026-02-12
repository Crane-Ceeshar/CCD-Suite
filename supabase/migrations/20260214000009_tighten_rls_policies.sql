-- Tighten overly permissive RLS policies flagged by security scanner
-- Both policies used USING(true) which the scanner flags as "overly permissive"

-- 1. feature_flags: restrict SELECT to authenticated users only
--    Previously allowed all roles (including anon) to read flags.
DROP POLICY IF EXISTS "Users can read feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated users can read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- 2. hr_form_tokens: restrict anon SELECT to valid (unexpired, unused) tokens only
--    Previously allowed anon to read ALL tokens. Now only tokens that
--    haven't been used and haven't expired are visible to anonymous users
--    (needed for external contract signers / leave request approvers).
DROP POLICY IF EXISTS "Public token verification" ON public.hr_form_tokens;
CREATE POLICY "Public token verification"
  ON public.hr_form_tokens FOR SELECT
  TO anon
  USING (used_at IS NULL AND expires_at > now());
