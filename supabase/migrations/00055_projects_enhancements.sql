-- ============================================================
-- Projects Module Enhancements
-- ============================================================

-- Add labels array to tasks for tagging/categorization
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS labels text[] NOT NULL DEFAULT '{}';

-- Add start_date to tasks for Gantt/timeline views
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS start_date date;

-- Add currency to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

-- Link internal projects to CRM contacts (client association)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

-- GIN index for label array containment queries
CREATE INDEX IF NOT EXISTS idx_tasks_labels
  ON public.tasks USING gin (labels);

-- Index for client_id on projects
CREATE INDEX IF NOT EXISTS idx_projects_client
  ON public.projects (client_id)
  WHERE client_id IS NOT NULL;
