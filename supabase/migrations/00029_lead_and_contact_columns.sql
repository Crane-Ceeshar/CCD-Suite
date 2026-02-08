-- ============================================================
-- Migration 00029: Lead fields, contact enhancements, slug check
-- ============================================================

-- 1. Add lead-specific and enhanced columns to contacts table
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'new_lead',
  ADD COLUMN IF NOT EXISTS qualification text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS comment text;

-- 2. Slug availability check function (for registration)
CREATE OR REPLACE FUNCTION public.check_slug_available(p_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = p_slug);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_slug_available(text) TO authenticated;

-- 3. Indexes for lead queries
CREATE INDEX IF NOT EXISTS idx_contacts_lead_status
  ON public.contacts(tenant_id, lead_status) WHERE status = 'lead';

CREATE INDEX IF NOT EXISTS idx_contacts_lead_source
  ON public.contacts(tenant_id, lead_source) WHERE status = 'lead';
