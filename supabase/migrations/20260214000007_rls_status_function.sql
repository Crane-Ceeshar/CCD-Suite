-- Function to check RLS status for public tables
-- Needed because pg_catalog.pg_tables cannot be queried via PostgREST
CREATE OR REPLACE FUNCTION public.check_rls_status(table_names text[])
RETURNS TABLE(tablename text, rowsecurity boolean)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT t.tablename::text, t.rowsecurity
  FROM pg_catalog.pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename = ANY(table_names);
$$;

-- Only allow service_role to call this function
REVOKE ALL ON FUNCTION public.check_rls_status(text[]) FROM public;
REVOKE ALL ON FUNCTION public.check_rls_status(text[]) FROM anon;
REVOKE ALL ON FUNCTION public.check_rls_status(text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_status(text[]) TO service_role;
