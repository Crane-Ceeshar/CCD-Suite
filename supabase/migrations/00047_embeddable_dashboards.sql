-- Add share_token and is_public columns to dashboards for embeddable/public dashboards
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS share_token text UNIQUE;
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboards_share_token ON dashboards(share_token) WHERE share_token IS NOT NULL;
