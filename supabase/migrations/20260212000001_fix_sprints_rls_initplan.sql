-- Fix: sprints_tenant_isolation RLS policy still triggering auth_rls_initplan linter warning
-- Ensure policy uses (SELECT public.get_current_tenant_id()) — no bare auth.uid() in policy text

DROP POLICY IF EXISTS sprints_tenant_isolation ON public.sprints;

CREATE POLICY sprints_tenant_isolation ON public.sprints
  FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
