-- Function to check RLS policies for public tables
-- Needed because pg_catalog.pg_policies cannot be queried via PostgREST
CREATE OR REPLACE FUNCTION public.check_rls_policies(table_names text[])
RETURNS TABLE(tablename text, policyname text, cmd text, qual text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.tablename::text, p.policyname::text, p.cmd::text, p.qual::text
  FROM pg_catalog.pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = ANY(table_names);
$$;

-- Only allow service_role to call this function
REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM public;
REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM anon;
REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_policies(text[]) TO service_role;
