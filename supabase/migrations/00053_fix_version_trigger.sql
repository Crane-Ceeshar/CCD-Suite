-- Fix the content_auto_snapshot trigger to use created_by instead of updated_by
-- (content_items does not have an updated_by column)
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
