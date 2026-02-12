-- Phase 5: AI usage analytics — daily usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  tokens_used bigint NOT NULL DEFAULT 0,
  request_count integer NOT NULL DEFAULT 0,
  chat_count integer NOT NULL DEFAULT 0,
  generation_count integer NOT NULL DEFAULT 0,
  insight_count integer NOT NULL DEFAULT 0,
  model text NOT NULL DEFAULT 'unknown',
  cost_estimate_usd numeric(10,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id, date, model)
);

-- RLS
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their tenant usage"
  ON public.ai_usage_daily FOR SELECT
  USING (tenant_id = (SELECT public.get_current_tenant_id()));

-- Index for analytics queries
CREATE INDEX idx_ai_usage_daily_tenant_date ON public.ai_usage_daily (tenant_id, date);

-- Upsert function for atomic increment
CREATE OR REPLACE FUNCTION public.upsert_ai_usage_daily(
  p_tenant_id uuid,
  p_user_id uuid,
  p_date date,
  p_tokens bigint,
  p_model text,
  p_type text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ai_usage_daily (tenant_id, user_id, date, tokens_used, request_count, chat_count, generation_count, insight_count, model)
  VALUES (
    p_tenant_id, p_user_id, p_date, p_tokens, 1,
    CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'generation' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'insight' THEN 1 ELSE 0 END,
    p_model
  )
  ON CONFLICT (tenant_id, user_id, date, model)
  DO UPDATE SET
    tokens_used = ai_usage_daily.tokens_used + p_tokens,
    request_count = ai_usage_daily.request_count + 1,
    chat_count = ai_usage_daily.chat_count + CASE WHEN p_type = 'chat' THEN 1 ELSE 0 END,
    generation_count = ai_usage_daily.generation_count + CASE WHEN p_type = 'generation' THEN 1 ELSE 0 END,
    insight_count = ai_usage_daily.insight_count + CASE WHEN p_type = 'insight' THEN 1 ELSE 0 END,
    updated_at = now();
END;
$$;
