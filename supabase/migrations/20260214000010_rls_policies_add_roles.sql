-- Update check_rls_policies to also return the roles column
-- so the scanner can distinguish role-scoped policies from public ones.
-- Must DROP first because CREATE OR REPLACE cannot change return type.
DROP FUNCTION IF EXISTS public.check_rls_policies(text[]);

CREATE FUNCTION public.check_rls_policies(table_names text[])
RETURNS TABLE(tablename text, policyname text, cmd text, qual text, roles text[])
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.tablename::text, p.policyname::text, p.cmd::text, p.qual::text, p.roles::text[]
  FROM pg_catalog.pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = ANY(table_names);
$$;

-- Restore permissions — only service_role can call this function
REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM public;
REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM anon;
REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_policies(text[]) TO service_role;
