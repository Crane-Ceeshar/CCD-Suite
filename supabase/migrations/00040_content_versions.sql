-- Content versioning system
CREATE TABLE IF NOT EXISTS content_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  body text,
  excerpt text,
  metadata jsonb DEFAULT '{}',
  status text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  snapshot_reason text DEFAULT 'auto'
);

CREATE INDEX IF NOT EXISTS idx_content_versions_item ON content_versions(content_item_id, version_number DESC);

-- Auto-snapshot trigger: creates a version on content_items UPDATE
CREATE OR REPLACE FUNCTION content_auto_snapshot() RETURNS trigger AS $$
DECLARE
  next_version integer;
BEGIN
  -- Only snapshot if body or title changed
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.body IS DISTINCT FROM NEW.body THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM content_versions WHERE content_item_id = OLD.id;

    INSERT INTO content_versions (content_item_id, version_number, title, body, excerpt, metadata, status, created_by, snapshot_reason)
    VALUES (OLD.id, next_version, OLD.title, OLD.body, OLD.excerpt, OLD.metadata, OLD.status, OLD.created_by, 'auto');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_auto_snapshot ON content_items;
CREATE TRIGGER trg_content_auto_snapshot
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION content_auto_snapshot();
