-- ============================================================
-- Migration: Add 'owner' user type, trial period, and plan updates
-- ============================================================

-- 1. Add trial_ends_at column to tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- 2. Add is_tenant_admin() helper that includes both platform admins and tenant owners
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT user_type IN ('admin', 'owner')
     FROM public.profiles
     WHERE id = auth.uid()),
    false
  )
$$;

-- 3. Update RLS policies to use is_tenant_admin() instead of is_admin()
-- This allows both platform admins and tenant owners to manage their tenant

-- Tenants policies
DROP POLICY IF EXISTS "Admins can update own tenant" ON public.tenants;
CREATE POLICY "Admins can update own tenant"
  ON public.tenants FOR UPDATE
  USING (id = public.get_current_tenant_id() AND public.is_tenant_admin());

-- Profiles policies
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON public.profiles;
CREATE POLICY "Admins can update tenant profiles"
  ON public.profiles FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin());

DROP POLICY IF EXISTS "Admins can insert tenant profiles" ON public.profiles;
CREATE POLICY "Admins can insert tenant profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin());

-- User type definitions policies
DROP POLICY IF EXISTS "Admins can insert user types" ON public.user_type_definitions;
CREATE POLICY "Admins can insert user types"
  ON public.user_type_definitions FOR INSERT
  WITH CHECK (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin());

DROP POLICY IF EXISTS "Admins can update user types" ON public.user_type_definitions;
CREATE POLICY "Admins can update user types"
  ON public.user_type_definitions FOR UPDATE
  USING (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin() AND NOT is_system);

DROP POLICY IF EXISTS "Admins can delete user types" ON public.user_type_definitions;
CREATE POLICY "Admins can delete user types"
  ON public.user_type_definitions FOR DELETE
  USING (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin() AND NOT is_system);

-- 4. Update register_tenant() to accept plan parameter and set trial period
-- Drop old function signature first, then create with new signature
DROP FUNCTION IF EXISTS public.register_tenant(text, text, jsonb);

CREATE OR REPLACE FUNCTION public.register_tenant(
  p_tenant_name text,
  p_tenant_slug text,
  p_settings jsonb DEFAULT '{}'::jsonb,
  p_plan text DEFAULT 'starter'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_tenant_id uuid;
  v_plan text;
  v_modules jsonb;
BEGIN
  -- Validate inputs
  IF p_tenant_name IS NULL OR length(trim(p_tenant_name)) < 2 THEN
    RAISE EXCEPTION 'Tenant name must be at least 2 characters';
  END IF;

  IF p_tenant_slug IS NULL OR length(trim(p_tenant_slug)) < 2 THEN
    RAISE EXCEPTION 'Tenant slug must be at least 2 characters';
  END IF;

  -- Validate plan
  v_plan := COALESCE(p_plan, 'starter');
  IF v_plan NOT IN ('starter', 'professional', 'enterprise', 'custom') THEN
    v_plan := 'starter';
  END IF;

  -- Determine modules based on plan
  IF v_plan IN ('professional', 'enterprise') THEN
    v_modules := '["crm","analytics","content","seo","social","client_portal","projects","finance","hr"]'::jsonb;
  ELSE
    v_modules := COALESCE(
      p_settings -> 'selected_modules',
      '["crm","analytics","content","seo","social","client_portal","projects","finance","hr"]'::jsonb
    );
  END IF;

  -- Check for duplicate slug
  IF EXISTS (SELECT 1 FROM public.tenants WHERE slug = p_tenant_slug) THEN
    RAISE EXCEPTION 'Organization slug already exists. Please choose a different name.';
  END IF;

  -- Create the tenant with trial period
  INSERT INTO public.tenants (name, slug, plan, settings, trial_ends_at)
  VALUES (
    trim(p_tenant_name),
    trim(p_tenant_slug),
    v_plan,
    jsonb_build_object(
      'modules_enabled', v_modules,
      'team_size', COALESCE(p_settings ->> 'team_size', '1-5'),
      'features', '{}'::jsonb
    ),
    now() + interval '14 days'
  )
  RETURNING id INTO v_tenant_id;

  RETURN v_tenant_id;
END;
$$;

-- Grant execute permissions for new function signature
GRANT EXECUTE ON FUNCTION public.register_tenant(text, text, jsonb, text) TO anon;
GRANT EXECUTE ON FUNCTION public.register_tenant(text, text, jsonb, text) TO authenticated;
