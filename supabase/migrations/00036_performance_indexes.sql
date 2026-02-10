-- Performance indexes for content and analytics modules

-- Deduplicate slugs before creating unique index: append '-dup-<rownum>' to duplicates
WITH dups AS (
  SELECT id, slug, tenant_id,
         ROW_NUMBER() OVER (PARTITION BY tenant_id, slug ORDER BY created_at) AS rn
  FROM content_items
  WHERE slug IS NOT NULL
)
UPDATE content_items
SET slug = dups.slug || '-dup-' || dups.rn
FROM dups
WHERE content_items.id = dups.id AND dups.rn > 1;

-- Composite index for content items by tenant + slug (unique, partial — NULLs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_items_tenant_slug ON content_items(tenant_id, slug) WHERE slug IS NOT NULL;

-- Content items by tenant + status (for filtering)
CREATE INDEX IF NOT EXISTS idx_content_items_tenant_status ON content_items(tenant_id, status);

-- Content items by tenant + created_by (for author filtering)
CREATE INDEX IF NOT EXISTS idx_content_items_tenant_created_by ON content_items(tenant_id, created_by);

-- Content approvals by reviewer + status
CREATE INDEX IF NOT EXISTS idx_content_approvals_reviewer_status ON content_approvals(reviewer_id, status);
