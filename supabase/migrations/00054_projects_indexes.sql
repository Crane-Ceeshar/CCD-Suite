-- ============================================================
-- Projects & Portal Performance Indexes
-- ============================================================

-- Projects composite indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant_status
  ON public.projects (tenant_id, status);

-- Tasks composite indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON public.tasks (project_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_project_assigned
  ON public.tasks (project_id, assigned_to);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_due_date
  ON public.tasks (tenant_id, due_date)
  WHERE due_date IS NOT NULL;

-- Time entries composite indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_task_user
  ON public.time_entries (task_id, user_id);

CREATE INDEX IF NOT EXISTS idx_time_entries_tenant_user
  ON public.time_entries (tenant_id, user_id);

-- Portal project indexes
CREATE INDEX IF NOT EXISTS idx_portal_projects_tenant_status
  ON public.portal_projects (tenant_id, status);

-- Portal milestone indexes
CREATE INDEX IF NOT EXISTS idx_portal_milestones_project_status
  ON public.portal_milestones (portal_project_id, status);

-- Portal deliverable indexes
CREATE INDEX IF NOT EXISTS idx_portal_deliverables_project_status
  ON public.portal_deliverables (portal_project_id, status);
