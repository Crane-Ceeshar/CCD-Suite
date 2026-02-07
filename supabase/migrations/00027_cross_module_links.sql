-- Migration: Cross-module links, email metadata, sort order columns
-- Enables: draggable table rows, email sending from CRM, portal-CRM linking

-- ============================================================
-- 1. Link portal projects to CRM contacts
-- ============================================================
ALTER TABLE public.portal_projects
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_portal_projects_contact
  ON public.portal_projects(contact_id);

-- ============================================================
-- 2. Email metadata on activities (for sent email tracking)
-- ============================================================
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS email_metadata jsonb;

-- ============================================================
-- 3. Sort order columns for draggable table rows
--    (deals already has a `position` column)
-- ============================================================
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Composite indexes for efficient ordering within a tenant
CREATE INDEX IF NOT EXISTS idx_contacts_sort_order
  ON public.contacts(tenant_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_companies_sort_order
  ON public.companies(tenant_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_activities_sort_order
  ON public.activities(tenant_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_products_sort_order
  ON public.products(tenant_id, sort_order);
