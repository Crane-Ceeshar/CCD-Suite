-- ===========================================================================
-- Migration: 20260211150001_supabase_linter_fixes.sql
-- Fixes 7 security + 78 performance issues flagged by Supabase Linter
-- ===========================================================================

-- -----------------------------------------------------------------------
-- SECTION 1: SECURITY — Fix function search_path (5 functions)
-- -----------------------------------------------------------------------

-- 1a. set_product_tenant (SECURITY DEFINER trigger — was missing search_path)
CREATE OR REPLACE FUNCTION public.set_product_tenant()
RETURNS trigger AS $$
BEGIN
  NEW.tenant_id := public.get_current_tenant_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 1b. handle_updated_at (trigger — was missing search_path)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1c. content_auto_snapshot (trigger — was missing search_path)
CREATE OR REPLACE FUNCTION public.content_auto_snapshot() RETURNS trigger AS $$
DECLARE
  next_version integer;
BEGIN
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.body IS DISTINCT FROM NEW.body THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM public.content_versions WHERE content_item_id = OLD.id;

    INSERT INTO public.content_versions (content_item_id, version_number, title, body, excerpt, metadata, status, created_by, snapshot_reason)
    VALUES (OLD.id, next_version, OLD.title, OLD.body, OLD.excerpt, OLD.metadata, OLD.status, OLD.created_by, 'auto');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1d. content_search_vector_update (trigger — was missing search_path)
CREATE OR REPLACE FUNCTION public.content_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.body, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1e. analytics_time_buckets (IMMUTABLE — was missing search_path)
CREATE OR REPLACE FUNCTION public.analytics_time_buckets(
  p_interval text,
  p_start    timestamptz,
  p_end      timestamptz
)
RETURNS TABLE(bucket_start timestamptz, bucket_end timestamptz, bucket_label text) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs AS bucket_start,
    CASE
      WHEN p_interval = '1 day'   THEN gs + INTERVAL '1 day'   - INTERVAL '1 second'
      WHEN p_interval = '1 week'  THEN gs + INTERVAL '1 week'  - INTERVAL '1 second'
      WHEN p_interval = '1 month' THEN gs + INTERVAL '1 month' - INTERVAL '1 second'
      ELSE gs + INTERVAL '1 day' - INTERVAL '1 second'
    END AS bucket_end,
    CASE
      WHEN p_interval = '1 day'   THEN TO_CHAR(gs, 'Dy, Mon DD')
      WHEN p_interval = '1 week'  THEN TO_CHAR(gs, 'Mon DD')
      WHEN p_interval = '1 month' THEN TO_CHAR(gs, 'Mon YY')
      ELSE TO_CHAR(gs, 'Mon DD')
    END AS bucket_label
  FROM generate_series(p_start, p_end, p_interval::interval) AS gs
  ORDER BY gs;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

-- -----------------------------------------------------------------------
-- SECTION 2: SECURITY — Enable RLS on content_versions + add policy
-- -----------------------------------------------------------------------

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for content_versions"
  ON public.content_versions FOR ALL
  USING (content_item_id IN (
    SELECT id FROM public.content_items WHERE tenant_id = (SELECT public.get_current_tenant_id())
  ))
  WITH CHECK (content_item_id IN (
    SELECT id FROM public.content_items WHERE tenant_id = (SELECT public.get_current_tenant_id())
  ));

GRANT SELECT, INSERT, DELETE ON public.content_versions TO authenticated;

-- -----------------------------------------------------------------------
-- SECTION 3 + 4: PERFORMANCE — Fix auth_rls_initplan + consolidate
--   multiple permissive policies. Drop and recreate every policy that
--   uses bare function calls. Wrap all in (SELECT ...) for initplan.
-- -----------------------------------------------------------------------

-- === tenants ===
DROP POLICY IF EXISTS "Users can view own tenant" ON public.tenants;
CREATE POLICY "Users can view own tenant"
  ON public.tenants FOR SELECT
  USING (id = (SELECT public.get_current_tenant_id()));

DROP POLICY IF EXISTS "Admins can update own tenant" ON public.tenants;
CREATE POLICY "Admins can update own tenant"
  ON public.tenants FOR UPDATE
  USING (id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));

-- === profiles (consolidate 2 UPDATE policies into 1) ===
DROP POLICY IF EXISTS "Users can view tenant profiles" ON public.profiles;
CREATE POLICY "Users can view tenant profiles"
  ON public.profiles FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON public.profiles;
CREATE POLICY "Users can update profiles"
  ON public.profiles FOR UPDATE
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND (id = (SELECT auth.uid()) OR (SELECT public.is_tenant_admin()))
  );

DROP POLICY IF EXISTS "Admins can insert tenant profiles" ON public.profiles;
CREATE POLICY "Admins can insert tenant profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND (SELECT public.is_tenant_admin())
  );

-- === user_type_definitions ===
DROP POLICY IF EXISTS "Users can view tenant user types" ON public.user_type_definitions;
CREATE POLICY "Users can view tenant user types"
  ON public.user_type_definitions FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

DROP POLICY IF EXISTS "Admins can insert user types" ON public.user_type_definitions;
CREATE POLICY "Admins can insert user types"
  ON public.user_type_definitions FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND (SELECT public.is_tenant_admin())
  );

DROP POLICY IF EXISTS "Admins can update user types" ON public.user_type_definitions;
CREATE POLICY "Admins can update user types"
  ON public.user_type_definitions FOR UPDATE
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND (SELECT public.is_tenant_admin())
    AND NOT is_system
  );

DROP POLICY IF EXISTS "Admins can delete user types" ON public.user_type_definitions;
CREATE POLICY "Admins can delete user types"
  ON public.user_type_definitions FOR DELETE
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND (SELECT public.is_tenant_admin())
    AND NOT is_system
  );

-- === CRM: companies ===
DROP POLICY IF EXISTS "Tenant isolation for companies" ON public.companies;
CREATE POLICY "Tenant isolation for companies"
  ON public.companies FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === CRM: contacts ===
DROP POLICY IF EXISTS "Tenant isolation for contacts" ON public.contacts;
CREATE POLICY "Tenant isolation for contacts"
  ON public.contacts FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === CRM: pipelines ===
DROP POLICY IF EXISTS "Tenant isolation for pipelines" ON public.pipelines;
CREATE POLICY "Tenant isolation for pipelines"
  ON public.pipelines FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === CRM: pipeline_stages ===
DROP POLICY IF EXISTS "Tenant isolation for pipeline_stages" ON public.pipeline_stages;
CREATE POLICY "Tenant isolation for pipeline_stages"
  ON public.pipeline_stages FOR ALL
  USING (
    pipeline_id IN (
      SELECT id FROM public.pipelines
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  )
  WITH CHECK (
    pipeline_id IN (
      SELECT id FROM public.pipelines
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- === CRM: deals ===
DROP POLICY IF EXISTS "Tenant isolation for deals" ON public.deals;
CREATE POLICY "Tenant isolation for deals"
  ON public.deals FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === CRM: activities ===
DROP POLICY IF EXISTS "Tenant isolation for activities" ON public.activities;
CREATE POLICY "Tenant isolation for activities"
  ON public.activities FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === CRM: products ===
DROP POLICY IF EXISTS "Tenant isolation for products" ON public.products;
CREATE POLICY "Tenant isolation for products"
  ON public.products FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === projects ===
DROP POLICY IF EXISTS "Tenant isolation for projects" ON public.projects;
CREATE POLICY "Tenant isolation for projects"
  ON public.projects FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === project_members ===
DROP POLICY IF EXISTS "Tenant isolation for project_members" ON public.project_members;
CREATE POLICY "Tenant isolation for project_members"
  ON public.project_members FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- === tasks ===
DROP POLICY IF EXISTS "Tenant isolation for tasks" ON public.tasks;
CREATE POLICY "Tenant isolation for tasks"
  ON public.tasks FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === time_entries ===
DROP POLICY IF EXISTS "Tenant isolation for time_entries" ON public.time_entries;
CREATE POLICY "Tenant isolation for time_entries"
  ON public.time_entries FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === content_categories ===
DROP POLICY IF EXISTS "Tenant isolation for content_categories" ON public.content_categories;
CREATE POLICY "Tenant isolation for content_categories"
  ON public.content_categories FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === content_items ===
DROP POLICY IF EXISTS "Tenant isolation for content_items" ON public.content_items;
CREATE POLICY "Tenant isolation for content_items"
  ON public.content_items FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === content_assets ===
DROP POLICY IF EXISTS "Tenant isolation for content_assets" ON public.content_assets;
CREATE POLICY "Tenant isolation for content_assets"
  ON public.content_assets FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === content_approvals ===
DROP POLICY IF EXISTS "Tenant isolation for content_approvals" ON public.content_approvals;
CREATE POLICY "Tenant isolation for content_approvals"
  ON public.content_approvals FOR ALL
  USING (
    content_item_id IN (
      SELECT id FROM public.content_items
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  )
  WITH CHECK (
    content_item_id IN (
      SELECT id FROM public.content_items
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- === dashboards ===
DROP POLICY IF EXISTS "Tenant isolation for dashboards" ON public.dashboards;
CREATE POLICY "Tenant isolation for dashboards"
  ON public.dashboards FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === widgets ===
DROP POLICY IF EXISTS "Tenant isolation for widgets" ON public.widgets;
CREATE POLICY "Tenant isolation for widgets"
  ON public.widgets FOR ALL
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  )
  WITH CHECK (
    dashboard_id IN (
      SELECT id FROM public.dashboards
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- === metrics ===
DROP POLICY IF EXISTS "Tenant isolation for metrics" ON public.metrics;
CREATE POLICY "Tenant isolation for metrics"
  ON public.metrics FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === notifications ===
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === invoices ===
DROP POLICY IF EXISTS "Tenant isolation for invoices" ON public.invoices;
CREATE POLICY "Tenant isolation for invoices"
  ON public.invoices FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === invoice_items ===
DROP POLICY IF EXISTS "Tenant isolation for invoice_items" ON public.invoice_items;
CREATE POLICY "Tenant isolation for invoice_items"
  ON public.invoice_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- === expenses ===
DROP POLICY IF EXISTS "Tenant isolation for expenses" ON public.expenses;
CREATE POLICY "Tenant isolation for expenses"
  ON public.expenses FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === payments ===
DROP POLICY IF EXISTS "Tenant isolation for payments" ON public.payments;
CREATE POLICY "Tenant isolation for payments"
  ON public.payments FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === departments ===
DROP POLICY IF EXISTS "Tenant isolation for departments" ON public.departments;
CREATE POLICY "Tenant isolation for departments"
  ON public.departments FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === employees ===
DROP POLICY IF EXISTS "Tenant isolation for employees" ON public.employees;
CREATE POLICY "Tenant isolation for employees"
  ON public.employees FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === leave_requests ===
DROP POLICY IF EXISTS "Tenant isolation for leave_requests" ON public.leave_requests;
CREATE POLICY "Tenant isolation for leave_requests"
  ON public.leave_requests FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === attendance_records ===
DROP POLICY IF EXISTS "Tenant isolation for attendance_records" ON public.attendance_records;
CREATE POLICY "Tenant isolation for attendance_records"
  ON public.attendance_records FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === payroll_runs ===
DROP POLICY IF EXISTS "Tenant isolation for payroll_runs" ON public.payroll_runs;
CREATE POLICY "Tenant isolation for payroll_runs"
  ON public.payroll_runs FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === payroll_items ===
DROP POLICY IF EXISTS "Tenant isolation for payroll_items" ON public.payroll_items;
CREATE POLICY "Tenant isolation for payroll_items"
  ON public.payroll_items FOR ALL
  USING (
    payroll_run_id IN (
      SELECT id FROM public.payroll_runs
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  )
  WITH CHECK (
    payroll_run_id IN (
      SELECT id FROM public.payroll_runs
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- === SEO: seo_projects ===
DROP POLICY IF EXISTS "seo_projects_tenant_select" ON public.seo_projects;
DROP POLICY IF EXISTS "seo_projects_tenant_insert" ON public.seo_projects;
DROP POLICY IF EXISTS "seo_projects_tenant_update" ON public.seo_projects;
DROP POLICY IF EXISTS "seo_projects_tenant_delete" ON public.seo_projects;
CREATE POLICY "seo_projects_tenant_select" ON public.seo_projects FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_projects_tenant_insert" ON public.seo_projects FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_projects_tenant_update" ON public.seo_projects FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_projects_tenant_delete" ON public.seo_projects FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === SEO: seo_audits ===
DROP POLICY IF EXISTS "seo_audits_tenant_select" ON public.seo_audits;
DROP POLICY IF EXISTS "seo_audits_tenant_insert" ON public.seo_audits;
DROP POLICY IF EXISTS "seo_audits_tenant_update" ON public.seo_audits;
DROP POLICY IF EXISTS "seo_audits_tenant_delete" ON public.seo_audits;
CREATE POLICY "seo_audits_tenant_select" ON public.seo_audits FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_audits_tenant_insert" ON public.seo_audits FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_audits_tenant_update" ON public.seo_audits FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_audits_tenant_delete" ON public.seo_audits FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === SEO: seo_keywords ===
DROP POLICY IF EXISTS "seo_keywords_tenant_select" ON public.seo_keywords;
DROP POLICY IF EXISTS "seo_keywords_tenant_insert" ON public.seo_keywords;
DROP POLICY IF EXISTS "seo_keywords_tenant_update" ON public.seo_keywords;
DROP POLICY IF EXISTS "seo_keywords_tenant_delete" ON public.seo_keywords;
CREATE POLICY "seo_keywords_tenant_select" ON public.seo_keywords FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_keywords_tenant_insert" ON public.seo_keywords FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_keywords_tenant_update" ON public.seo_keywords FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_keywords_tenant_delete" ON public.seo_keywords FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === SEO: seo_rank_history ===
DROP POLICY IF EXISTS "seo_rank_history_tenant_select" ON public.seo_rank_history;
DROP POLICY IF EXISTS "seo_rank_history_tenant_insert" ON public.seo_rank_history;
DROP POLICY IF EXISTS "seo_rank_history_tenant_delete" ON public.seo_rank_history;
CREATE POLICY "seo_rank_history_tenant_select" ON public.seo_rank_history FOR SELECT
  USING (keyword_id IN (SELECT id FROM public.seo_keywords WHERE tenant_id = (SELECT public.get_current_tenant_id())));
CREATE POLICY "seo_rank_history_tenant_insert" ON public.seo_rank_history FOR INSERT
  WITH CHECK (keyword_id IN (SELECT id FROM public.seo_keywords WHERE tenant_id = (SELECT public.get_current_tenant_id())));
CREATE POLICY "seo_rank_history_tenant_delete" ON public.seo_rank_history FOR DELETE
  USING (keyword_id IN (SELECT id FROM public.seo_keywords WHERE tenant_id = (SELECT public.get_current_tenant_id())));

-- === SEO: seo_backlinks ===
DROP POLICY IF EXISTS "seo_backlinks_tenant_select" ON public.seo_backlinks;
DROP POLICY IF EXISTS "seo_backlinks_tenant_insert" ON public.seo_backlinks;
DROP POLICY IF EXISTS "seo_backlinks_tenant_update" ON public.seo_backlinks;
DROP POLICY IF EXISTS "seo_backlinks_tenant_delete" ON public.seo_backlinks;
CREATE POLICY "seo_backlinks_tenant_select" ON public.seo_backlinks FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_backlinks_tenant_insert" ON public.seo_backlinks FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_backlinks_tenant_update" ON public.seo_backlinks FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_backlinks_tenant_delete" ON public.seo_backlinks FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === SEO: seo_recommendations ===
DROP POLICY IF EXISTS "seo_recommendations_tenant_select" ON public.seo_recommendations;
DROP POLICY IF EXISTS "seo_recommendations_tenant_insert" ON public.seo_recommendations;
DROP POLICY IF EXISTS "seo_recommendations_tenant_update" ON public.seo_recommendations;
DROP POLICY IF EXISTS "seo_recommendations_tenant_delete" ON public.seo_recommendations;
CREATE POLICY "seo_recommendations_tenant_select" ON public.seo_recommendations FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_recommendations_tenant_insert" ON public.seo_recommendations FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_recommendations_tenant_update" ON public.seo_recommendations FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "seo_recommendations_tenant_delete" ON public.seo_recommendations FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Social: social_campaigns ===
DROP POLICY IF EXISTS "social_campaigns_tenant_select" ON public.social_campaigns;
DROP POLICY IF EXISTS "social_campaigns_tenant_insert" ON public.social_campaigns;
DROP POLICY IF EXISTS "social_campaigns_tenant_update" ON public.social_campaigns;
DROP POLICY IF EXISTS "social_campaigns_tenant_delete" ON public.social_campaigns;
CREATE POLICY "social_campaigns_tenant_select" ON public.social_campaigns FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_campaigns_tenant_insert" ON public.social_campaigns FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_campaigns_tenant_update" ON public.social_campaigns FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_campaigns_tenant_delete" ON public.social_campaigns FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Social: social_accounts ===
DROP POLICY IF EXISTS "social_accounts_tenant_select" ON public.social_accounts;
DROP POLICY IF EXISTS "social_accounts_tenant_insert" ON public.social_accounts;
DROP POLICY IF EXISTS "social_accounts_tenant_update" ON public.social_accounts;
DROP POLICY IF EXISTS "social_accounts_tenant_delete" ON public.social_accounts;
CREATE POLICY "social_accounts_tenant_select" ON public.social_accounts FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_accounts_tenant_insert" ON public.social_accounts FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_accounts_tenant_update" ON public.social_accounts FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_accounts_tenant_delete" ON public.social_accounts FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Social: social_posts ===
DROP POLICY IF EXISTS "social_posts_tenant_select" ON public.social_posts;
DROP POLICY IF EXISTS "social_posts_tenant_insert" ON public.social_posts;
DROP POLICY IF EXISTS "social_posts_tenant_update" ON public.social_posts;
DROP POLICY IF EXISTS "social_posts_tenant_delete" ON public.social_posts;
CREATE POLICY "social_posts_tenant_select" ON public.social_posts FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_posts_tenant_insert" ON public.social_posts FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_posts_tenant_update" ON public.social_posts FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_posts_tenant_delete" ON public.social_posts FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Social: social_engagement ===
DROP POLICY IF EXISTS "social_engagement_tenant_select" ON public.social_engagement;
DROP POLICY IF EXISTS "social_engagement_tenant_insert" ON public.social_engagement;
DROP POLICY IF EXISTS "social_engagement_tenant_update" ON public.social_engagement;
DROP POLICY IF EXISTS "social_engagement_tenant_delete" ON public.social_engagement;
CREATE POLICY "social_engagement_tenant_select" ON public.social_engagement FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_engagement_tenant_insert" ON public.social_engagement FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_engagement_tenant_update" ON public.social_engagement FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_engagement_tenant_delete" ON public.social_engagement FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Social: social_comments ===
DROP POLICY IF EXISTS "social_comments_tenant_select" ON public.social_comments;
DROP POLICY IF EXISTS "social_comments_tenant_insert" ON public.social_comments;
DROP POLICY IF EXISTS "social_comments_tenant_update" ON public.social_comments;
DROP POLICY IF EXISTS "social_comments_tenant_delete" ON public.social_comments;
CREATE POLICY "social_comments_tenant_select" ON public.social_comments FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_comments_tenant_insert" ON public.social_comments FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_comments_tenant_update" ON public.social_comments FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "social_comments_tenant_delete" ON public.social_comments FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Social: social_provider_profiles ===
DROP POLICY IF EXISTS "social_provider_profiles_tenant_isolation" ON public.social_provider_profiles;
CREATE POLICY "social_provider_profiles_tenant_isolation"
  ON public.social_provider_profiles FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Portal: portal_projects ===
DROP POLICY IF EXISTS "Tenant isolation for portal_projects" ON public.portal_projects;
CREATE POLICY "Tenant isolation for portal_projects"
  ON public.portal_projects FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()) OR client_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Portal: portal_milestones ===
DROP POLICY IF EXISTS "Tenant isolation for portal_milestones" ON public.portal_milestones;
CREATE POLICY "Tenant isolation for portal_milestones"
  ON public.portal_milestones FOR ALL
  USING (
    portal_project_id IN (
      SELECT id FROM public.portal_projects
      WHERE tenant_id = (SELECT public.get_current_tenant_id()) OR client_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    portal_project_id IN (
      SELECT id FROM public.portal_projects
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- === Portal: portal_deliverables ===
DROP POLICY IF EXISTS "Tenant isolation for portal_deliverables" ON public.portal_deliverables;
CREATE POLICY "Tenant isolation for portal_deliverables"
  ON public.portal_deliverables FOR ALL
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    OR portal_project_id IN (SELECT id FROM public.portal_projects WHERE client_id = (SELECT auth.uid()))
  )
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Portal: portal_messages (consolidate 2 policies into separated commands) ===
DROP POLICY IF EXISTS "Tenant members see all messages" ON public.portal_messages;
DROP POLICY IF EXISTS "Clients see non-internal messages" ON public.portal_messages;
CREATE POLICY "Portal messages read access"
  ON public.portal_messages FOR SELECT
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    OR (
      is_internal = false
      AND portal_project_id IN (SELECT id FROM public.portal_projects WHERE client_id = (SELECT auth.uid()))
    )
  );
CREATE POLICY "Portal messages write access"
  ON public.portal_messages FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "Portal messages update access"
  ON public.portal_messages FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "Portal messages delete access"
  ON public.portal_messages FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Portal: portal_access_tokens ===
DROP POLICY IF EXISTS "Tenant isolation for portal_access_tokens" ON public.portal_access_tokens;
CREATE POLICY "Tenant isolation for portal_access_tokens"
  ON public.portal_access_tokens FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === AI: ai_conversations ===
DROP POLICY IF EXISTS "Tenant isolation for ai_conversations" ON public.ai_conversations;
CREATE POLICY "Tenant isolation for ai_conversations"
  ON public.ai_conversations FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND user_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND user_id = (SELECT auth.uid()));

-- === AI: ai_messages ===
DROP POLICY IF EXISTS "Owner access for ai_messages" ON public.ai_messages;
CREATE POLICY "Owner access for ai_messages"
  ON public.ai_messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations
      WHERE tenant_id = (SELECT public.get_current_tenant_id()) AND user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.ai_conversations
      WHERE tenant_id = (SELECT public.get_current_tenant_id()) AND user_id = (SELECT auth.uid())
    )
  );

-- === AI: ai_generation_jobs ===
DROP POLICY IF EXISTS "Tenant isolation for ai_generation_jobs" ON public.ai_generation_jobs;
CREATE POLICY "Tenant isolation for ai_generation_jobs"
  ON public.ai_generation_jobs FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND user_id = (SELECT auth.uid()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND user_id = (SELECT auth.uid()));

-- === AI: ai_settings ===
DROP POLICY IF EXISTS "Tenant isolation for ai_settings" ON public.ai_settings;
CREATE POLICY "Tenant isolation for ai_settings"
  ON public.ai_settings FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === AI: ai_insights ===
DROP POLICY IF EXISTS "Tenant isolation for ai_insights" ON public.ai_insights;
CREATE POLICY "Tenant isolation for ai_insights"
  ON public.ai_insights FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === AI: ai_automations ===
DROP POLICY IF EXISTS "Tenant isolation for ai_automations" ON public.ai_automations;
CREATE POLICY "Tenant isolation for ai_automations"
  ON public.ai_automations FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === AI: ai_module_context ===
DROP POLICY IF EXISTS "ai_module_context_tenant_read" ON public.ai_module_context;
CREATE POLICY "ai_module_context_tenant_read"
  ON public.ai_module_context FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

DROP POLICY IF EXISTS "ai_module_context_tenant_insert" ON public.ai_module_context;
CREATE POLICY "ai_module_context_tenant_insert"
  ON public.ai_module_context FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Admin: activity_logs (consolidate 3 SELECT policies into 1) ===
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Tenant admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    tenant_id = (SELECT public.get_current_tenant_id())
    AND ((SELECT public.is_admin()) OR (SELECT public.is_tenant_admin()))
  );

DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === Admin: system_settings (consolidate ALL + SELECT into separate commands) ===
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Tenant admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Tenant users can view system settings" ON public.system_settings;
CREATE POLICY "Tenant users can view system settings"
  ON public.system_settings FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "Tenant admins can insert system settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));
CREATE POLICY "Tenant admins can update system settings"
  ON public.system_settings FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));
CREATE POLICY "Tenant admins can delete system settings"
  ON public.system_settings FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));

-- === Admin: api_keys ===
DROP POLICY IF EXISTS "Admins can manage api keys" ON public.api_keys;
CREATE POLICY "Admins can manage api keys"
  ON public.api_keys FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_admin()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_admin()));

-- === system_announcements (consolidate ALL + SELECT) ===
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.system_announcements;
DROP POLICY IF EXISTS "Users can view active announcements" ON public.system_announcements;
CREATE POLICY "Users can view active announcements"
  ON public.system_announcements FOR SELECT
  USING (
    is_active = true AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at >= now())
    AND (tenant_id IS NULL OR tenant_id = (SELECT public.get_current_tenant_id()))
  );
CREATE POLICY "Admins can insert announcements"
  ON public.system_announcements FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins can update announcements"
  ON public.system_announcements FOR UPDATE
  USING ((SELECT public.is_admin()));
CREATE POLICY "Admins can delete announcements"
  ON public.system_announcements FOR DELETE
  USING ((SELECT public.is_admin()));

-- === feature_flags (consolidate ALL + SELECT) ===
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Users can read feature flags" ON public.feature_flags;
CREATE POLICY "Users can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);
CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE
  USING ((SELECT public.is_admin()));
CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags FOR DELETE
  USING ((SELECT public.is_admin()));

-- === feature_flag_overrides (consolidate ALL + SELECT) ===
DROP POLICY IF EXISTS "Admins can manage flag overrides" ON public.feature_flag_overrides;
DROP POLICY IF EXISTS "Users can read their tenant flag overrides" ON public.feature_flag_overrides;
CREATE POLICY "Users can read their tenant flag overrides"
  ON public.feature_flag_overrides FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "Admins can insert flag overrides"
  ON public.feature_flag_overrides FOR INSERT
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY "Admins can update flag overrides"
  ON public.feature_flag_overrides FOR UPDATE
  USING ((SELECT public.is_admin()));
CREATE POLICY "Admins can delete flag overrides"
  ON public.feature_flag_overrides FOR DELETE
  USING ((SELECT public.is_admin()));

-- === pending_invitations (consolidate ALL + SELECT) ===
DROP POLICY IF EXISTS "Tenant users can view invitations" ON public.pending_invitations;
DROP POLICY IF EXISTS "Tenant admins can manage invitations" ON public.pending_invitations;
CREATE POLICY "Tenant users can view invitations"
  ON public.pending_invitations FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "Tenant admins can insert invitations"
  ON public.pending_invitations FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));
CREATE POLICY "Tenant admins can update invitations"
  ON public.pending_invitations FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));
CREATE POLICY "Tenant admins can delete invitations"
  ON public.pending_invitations FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));

-- === webhooks (consolidate ALL + SELECT) ===
DROP POLICY IF EXISTS "Tenant users can view webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Tenant admins can manage webhooks" ON public.webhooks;
CREATE POLICY "Tenant users can view webhooks"
  ON public.webhooks FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "Tenant admins can insert webhooks"
  ON public.webhooks FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));
CREATE POLICY "Tenant admins can update webhooks"
  ON public.webhooks FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));
CREATE POLICY "Tenant admins can delete webhooks"
  ON public.webhooks FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));

-- === custom_field_definitions (consolidate ALL + SELECT) ===
DROP POLICY IF EXISTS "Tenant users can view custom field definitions" ON public.custom_field_definitions;
DROP POLICY IF EXISTS "Tenant admins can manage custom field definitions" ON public.custom_field_definitions;
CREATE POLICY "Tenant users can view custom field definitions"
  ON public.custom_field_definitions FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "Tenant admins can insert custom field definitions"
  ON public.custom_field_definitions FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));
CREATE POLICY "Tenant admins can update custom field definitions"
  ON public.custom_field_definitions FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));
CREATE POLICY "Tenant admins can delete custom field definitions"
  ON public.custom_field_definitions FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_tenant_admin()));

-- === content_templates ===
DROP POLICY IF EXISTS "content_templates_tenant_select" ON public.content_templates;
DROP POLICY IF EXISTS "content_templates_tenant_insert" ON public.content_templates;
DROP POLICY IF EXISTS "content_templates_tenant_update" ON public.content_templates;
DROP POLICY IF EXISTS "content_templates_tenant_delete" ON public.content_templates;
CREATE POLICY "content_templates_tenant_select" ON public.content_templates FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()) OR is_system = true);
CREATE POLICY "content_templates_tenant_insert" ON public.content_templates FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "content_templates_tenant_update" ON public.content_templates FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND is_system = false);
CREATE POLICY "content_templates_tenant_delete" ON public.content_templates FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND is_system = false);

-- === analytics_reports ===
DROP POLICY IF EXISTS "analytics_reports_tenant_select" ON public.analytics_reports;
DROP POLICY IF EXISTS "analytics_reports_tenant_insert" ON public.analytics_reports;
DROP POLICY IF EXISTS "analytics_reports_tenant_update" ON public.analytics_reports;
DROP POLICY IF EXISTS "analytics_reports_tenant_delete" ON public.analytics_reports;
CREATE POLICY "analytics_reports_tenant_select" ON public.analytics_reports FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "analytics_reports_tenant_insert" ON public.analytics_reports FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "analytics_reports_tenant_update" ON public.analytics_reports FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "analytics_reports_tenant_delete" ON public.analytics_reports FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- === content_roles (consolidate ALL + SELECT) ===
DROP POLICY IF EXISTS "Users can view content roles in their tenant" ON public.content_roles;
DROP POLICY IF EXISTS "Admins can manage content roles" ON public.content_roles;
CREATE POLICY "Users can view content roles"
  ON public.content_roles FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));
CREATE POLICY "Admins can insert content roles"
  ON public.content_roles FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_admin()));
CREATE POLICY "Admins can update content roles"
  ON public.content_roles FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_admin()));
CREATE POLICY "Admins can delete content roles"
  ON public.content_roles FOR DELETE
  USING (tenant_id = (SELECT public.get_current_tenant_id()) AND (SELECT public.is_admin()));

-- === content_comments ===
DROP POLICY IF EXISTS "Users can view comments in their tenant" ON public.content_comments;
CREATE POLICY "Users can view comments in their tenant"
  ON public.content_comments FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

DROP POLICY IF EXISTS "Users can create comments" ON public.content_comments;
CREATE POLICY "Users can create comments"
  ON public.content_comments FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()) AND author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authors can update own comments" ON public.content_comments;
CREATE POLICY "Authors can update own comments"
  ON public.content_comments FOR UPDATE
  USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authors and admins can delete comments" ON public.content_comments;
CREATE POLICY "Authors and admins can delete comments"
  ON public.content_comments FOR DELETE
  USING (author_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- === analytics_goals (already uses subselect but re-wrap for consistency) ===
DROP POLICY IF EXISTS "Tenant isolation for analytics_goals" ON public.analytics_goals;
CREATE POLICY "Tenant isolation for analytics_goals"
  ON public.analytics_goals FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === analytics_alerts (already uses subselect but re-wrap for consistency) ===
DROP POLICY IF EXISTS "Tenant isolation for analytics_alerts" ON public.analytics_alerts;
CREATE POLICY "Tenant isolation for analytics_alerts"
  ON public.analytics_alerts FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === custom_metrics ===
DROP POLICY IF EXISTS "Tenant isolation for custom_metrics" ON public.custom_metrics;
CREATE POLICY "Tenant isolation for custom_metrics"
  ON public.custom_metrics FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === content_analytics ===
DROP POLICY IF EXISTS "Tenant isolation for content_analytics" ON public.content_analytics;
CREATE POLICY "Tenant isolation for content_analytics"
  ON public.content_analytics FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === publishing_integrations ===
DROP POLICY IF EXISTS "Tenant isolation for publishing_integrations" ON public.publishing_integrations;
CREATE POLICY "Tenant isolation for publishing_integrations"
  ON public.publishing_integrations FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === publish_log ===
DROP POLICY IF EXISTS "Tenant isolation for publish_log" ON public.publish_log;
CREATE POLICY "Tenant isolation for publish_log"
  ON public.publish_log FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === tenant_usage ===
DROP POLICY IF EXISTS "Tenant isolation for tenant_usage" ON public.tenant_usage;
CREATE POLICY "Tenant isolation for tenant_usage"
  ON public.tenant_usage FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === recurring_invoices ===
DROP POLICY IF EXISTS "Tenant isolation for recurring_invoices" ON public.recurring_invoices;
CREATE POLICY "Tenant isolation for recurring_invoices"
  ON public.recurring_invoices FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === credit_notes ===
DROP POLICY IF EXISTS "Tenant isolation for credit_notes" ON public.credit_notes;
CREATE POLICY "Tenant isolation for credit_notes"
  ON public.credit_notes FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === portal_notifications ===
DROP POLICY IF EXISTS "portal_notifications_tenant_isolation" ON public.portal_notifications;
CREATE POLICY "portal_notifications_tenant_isolation"
  ON public.portal_notifications FOR ALL
  USING (tenant_id = (SELECT public.get_current_tenant_id()))
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

-- === project_links ===
DROP POLICY IF EXISTS "Tenant isolation" ON public.project_links;
CREATE POLICY "Tenant isolation for project_links"
  ON public.project_links FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- === task_dependencies (already uses EXISTS but re-wrap auth calls) ===
DROP POLICY IF EXISTS "Access via task" ON public.task_dependencies;
CREATE POLICY "Access via task"
  ON public.task_dependencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND t.tenant_id = (SELECT public.get_current_tenant_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
      AND t.tenant_id = (SELECT public.get_current_tenant_id())
    )
  );

-- -----------------------------------------------------------------------
-- SECTION 5: PERFORMANCE — Add missing FK indexes
-- -----------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_deals_company ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON public.deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_activities_company ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_profile ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_head ON public.departments(head_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON public.payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON public.task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_seo_recommendations_audit ON public.seo_recommendations(audit_id);
CREATE INDEX IF NOT EXISTS idx_portal_projects_project ON public.portal_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_portal_messages_sender ON public.portal_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_publish_log_integration ON public.publish_log(integration_id);

-- -----------------------------------------------------------------------
-- SECTION 6: PERFORMANCE — Remove duplicate indexes
-- -----------------------------------------------------------------------

DROP INDEX IF EXISTS idx_products_tenant;
DROP INDEX IF EXISTS idx_content_items_tenant;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_api_keys_tenant;
DROP INDEX IF EXISTS idx_webhooks_tenant;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
