-- Add media library columns to content_assets
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE content_assets ADD COLUMN IF NOT EXISTS is_library boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_content_assets_tags ON content_assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_content_assets_library ON content_assets(tenant_id, is_library) WHERE is_library = true;
