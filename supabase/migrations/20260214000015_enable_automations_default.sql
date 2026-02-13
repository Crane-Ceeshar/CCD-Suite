-- Enable automations feature for all existing tenants where it was disabled by default
UPDATE ai_settings
SET features_enabled = features_enabled || '{"automations": true}'::jsonb
WHERE (features_enabled->>'automations')::boolean IS NOT TRUE;
