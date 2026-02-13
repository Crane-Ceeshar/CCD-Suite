-- ============================================================
-- Fix Supabase linter warnings
-- ============================================================

-- 1. Fix function_search_path_mutable for check_rls_status
DROP FUNCTION IF EXISTS public.check_rls_status(text[]);
CREATE FUNCTION public.check_rls_status(table_names text[])
RETURNS TABLE(tablename text, rowsecurity boolean)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT t.tablename::text, t.rowsecurity
  FROM pg_catalog.pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename = ANY(table_names);
$$;

REVOKE ALL ON FUNCTION public.check_rls_status(text[]) FROM public;
REVOKE ALL ON FUNCTION public.check_rls_status(text[]) FROM anon;
REVOKE ALL ON FUNCTION public.check_rls_status(text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_status(text[]) TO service_role;

-- 2. Fix function_search_path_mutable for check_rls_policies
DROP FUNCTION IF EXISTS public.check_rls_policies(text[]);
CREATE FUNCTION public.check_rls_policies(table_names text[])
RETURNS TABLE(tablename text, policyname text, cmd text, qual text, roles text[])
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT p.tablename::text, p.policyname::text, p.cmd::text, p.qual::text, p.roles::text[]
  FROM pg_catalog.pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = ANY(table_names);
$$;

REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM public;
REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM anon;
REVOKE ALL ON FUNCTION public.check_rls_policies(text[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rls_policies(text[]) TO service_role;

-- 3. Fix function_search_path_mutable for upsert_ai_usage_daily
--    Must match original signature: (uuid, uuid, date, bigint, text, text)
CREATE OR REPLACE FUNCTION public.upsert_ai_usage_daily(
  p_tenant_id uuid,
  p_user_id uuid,
  p_date date,
  p_tokens bigint,
  p_model text,
  p_type text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_usage_daily (tenant_id, user_id, date, tokens_used, request_count, chat_count, generation_count, insight_count, model)
  VALUES (
    p_tenant_id, p_user_id, p_date, p_tokens, 1,
    CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'generation' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'insight' THEN 1 ELSE 0 END,
    p_model
  )
  ON CONFLICT (tenant_id, user_id, date, model)
  DO UPDATE SET
    tokens_used = public.ai_usage_daily.tokens_used + p_tokens,
    request_count = public.ai_usage_daily.request_count + 1,
    chat_count = public.ai_usage_daily.chat_count + CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
    generation_count = public.ai_usage_daily.generation_count + CASE WHEN p_type = 'generation' THEN 1 ELSE 0 END,
    insight_count = public.ai_usage_daily.insight_count + CASE WHEN p_type = 'insight' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;

-- 4. Fix security_events: remove overly permissive INSERT policy and
--    remove duplicate permissive policies for the same role/action.
--    Server-side security logging uses the service client (bypasses RLS)
--    so the public INSERT policy is unnecessary.
DROP POLICY IF EXISTS "Allow public insert for security logging" ON public.security_events;
