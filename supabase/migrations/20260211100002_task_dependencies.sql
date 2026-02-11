-- Task dependencies for Gantt/timeline view
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type text NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'blocked_by', 'relates_to')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
-- Dependencies inherit visibility from their task (tasks already have tenant RLS)
CREATE POLICY "Access via task" ON public.task_dependencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id)
  );
