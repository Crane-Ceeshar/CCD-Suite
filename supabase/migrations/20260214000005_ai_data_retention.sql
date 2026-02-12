-- Phase 8: Data Retention settings and monthly token reset tracking

ALTER TABLE public.ai_settings
  ADD COLUMN IF NOT EXISTS conversation_retention_days integer DEFAULT 90,
  ADD COLUMN IF NOT EXISTS insight_retention_days integer DEFAULT 180,
  ADD COLUMN IF NOT EXISTS generation_retention_days integer DEFAULT 90,
  ADD COLUMN IF NOT EXISTS last_token_reset_at timestamptz;

COMMENT ON COLUMN public.ai_settings.conversation_retention_days IS 'Days to retain AI conversations before cleanup (0 = keep forever)';
COMMENT ON COLUMN public.ai_settings.insight_retention_days IS 'Days to retain AI insights before cleanup (0 = keep forever)';
COMMENT ON COLUMN public.ai_settings.generation_retention_days IS 'Days to retain AI generation jobs before cleanup (0 = keep forever)';
COMMENT ON COLUMN public.ai_settings.last_token_reset_at IS 'Timestamp of the last monthly token usage reset';
