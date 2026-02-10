-- Add audit columns to content_approvals
ALTER TABLE content_approvals ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE content_approvals ADD COLUMN IF NOT EXISTS audit_notes text;

-- Partial unique: only one pending approval per content item per reviewer
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_approvals_pending_unique
  ON content_approvals(content_item_id, reviewer_id)
  WHERE status = 'pending';
