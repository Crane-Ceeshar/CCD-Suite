-- ============================================================
-- Social Media Ayrshare Integration
-- Adds external tracking, provider profiles, and indexes
-- ============================================================

-- Add external post tracking columns to social_posts
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS publish_error text;

CREATE INDEX IF NOT EXISTS idx_social_posts_external_id
  ON public.social_posts (external_id) WHERE external_id IS NOT NULL;

-- Add unique constraint on external_id in social_comments to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_comments_external_id
  ON public.social_comments (external_id) WHERE external_id IS NOT NULL;

-- Ayrshare provider profile per tenant
CREATE TABLE IF NOT EXISTS public.social_provider_profiles (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'ayrshare',
  profile_key text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

CREATE TRIGGER social_provider_profiles_updated_at
  BEFORE UPDATE ON public.social_provider_profiles
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

ALTER TABLE public.social_provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_provider_profiles_tenant_isolation"
  ON public.social_provider_profiles FOR ALL
  USING (tenant_id = public.get_current_tenant_id());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.social_provider_profiles TO authenticated;
