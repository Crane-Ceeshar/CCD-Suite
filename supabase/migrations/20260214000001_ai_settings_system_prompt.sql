-- Phase 4: Custom system prompts & multi-model support
-- Adds system_prompt and available_models columns to ai_settings

ALTER TABLE public.ai_settings
  ADD COLUMN IF NOT EXISTS system_prompt text DEFAULT '',
  ADD COLUMN IF NOT EXISTS available_models text[] DEFAULT ARRAY[
    'claude-sonnet-4-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022'
  ];

COMMENT ON COLUMN public.ai_settings.system_prompt IS
  'Custom system prompt for the tenant — brand voice, compliance rules, instructions';
COMMENT ON COLUMN public.ai_settings.available_models IS
  'Array of model identifiers enabled for this tenant';
