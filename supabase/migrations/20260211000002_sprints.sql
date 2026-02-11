-- Phase 7: Sprints table and task enhancements for agile

-- Create sprints table
CREATE TABLE IF NOT EXISTS public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  capacity_points integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sprints_project_status ON public.sprints (project_id, status);
CREATE INDEX IF NOT EXISTS idx_sprints_tenant ON public.sprints (tenant_id);

-- Add sprint_id and story_points to tasks if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'sprint_id'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'story_points'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN story_points integer;
  END IF;
END $$;

-- Index for querying tasks by sprint
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON public.tasks (sprint_id);

-- RLS for sprints (tenant isolation)
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sprints' AND policyname = 'sprints_tenant_isolation'
  ) THEN
    CREATE POLICY sprints_tenant_isolation ON public.sprints
      FOR ALL
      USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
      WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- Updated_at trigger for sprints
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sprints_updated_at ON public.sprints;
CREATE TRIGGER sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
