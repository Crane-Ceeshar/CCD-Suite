-- Phase 7: AI Automation Scheduler — schedule config and run history

-- Add scheduling columns to ai_automations
ALTER TABLE public.ai_automations
  ADD COLUMN IF NOT EXISTS schedule_type text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS schedule_config jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz;

COMMENT ON COLUMN public.ai_automations.schedule_type IS 'manual | daily | weekly | monthly';
COMMENT ON COLUMN public.ai_automations.schedule_config IS 'Schedule configuration: { day_of_week, time, day_of_month }';
COMMENT ON COLUMN public.ai_automations.next_run_at IS 'Next scheduled execution time';

-- Add check constraint for schedule_type
ALTER TABLE public.ai_automations
  ADD CONSTRAINT ai_automations_schedule_type_check
  CHECK (schedule_type IN ('manual', 'daily', 'weekly', 'monthly'));

-- Automation run history
CREATE TABLE IF NOT EXISTS public.ai_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.ai_automations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  result jsonb DEFAULT '{}',
  error_message text,
  tokens_used integer DEFAULT 0,
  items_processed integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view automation runs"
  ON public.ai_automation_runs FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant members can insert automation runs"
  ON public.ai_automation_runs FOR INSERT
  WITH CHECK (tenant_id = (SELECT public.get_current_tenant_id()));

CREATE POLICY "Tenant members can update automation runs"
  ON public.ai_automation_runs FOR UPDATE
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- Add check constraint for run status
ALTER TABLE public.ai_automation_runs
  ADD CONSTRAINT ai_automation_runs_status_check
  CHECK (status IN ('running', 'completed', 'failed'));

-- Indexes
CREATE INDEX idx_ai_automation_runs_automation ON public.ai_automation_runs (automation_id);
CREATE INDEX idx_ai_automation_runs_tenant ON public.ai_automation_runs (tenant_id);
CREATE INDEX idx_ai_automation_runs_status ON public.ai_automation_runs (status);
CREATE INDEX idx_ai_automations_next_run ON public.ai_automations (next_run_at)
  WHERE is_enabled = true AND schedule_type != 'manual';
