-- Threaded comments on content items
CREATE TABLE IF NOT EXISTS content_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES content_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  position_anchor text,
  mentions uuid[] DEFAULT '{}',
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_content_comments_item ON content_comments(content_item_id);
CREATE INDEX idx_content_comments_parent ON content_comments(parent_id);
CREATE INDEX idx_content_comments_author ON content_comments(author_id);

ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their tenant"
  ON content_comments FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Users can create comments"
  ON content_comments FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id() AND author_id = auth.uid());

CREATE POLICY "Authors can update own comments"
  ON content_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors and admins can delete comments"
  ON content_comments FOR DELETE
  USING (author_id = auth.uid() OR is_admin());
