-- ============================================================
-- Increase storage bucket file size limits
-- project-files: 100MB → 500MB (support large deliverables, zips)
-- content-assets: 50MB → 200MB (support larger content files)
-- ============================================================

UPDATE storage.buckets
SET file_size_limit = 524288000  -- 500MB
WHERE id = 'project-files';

UPDATE storage.buckets
SET file_size_limit = 209715200  -- 200MB
WHERE id = 'content-assets';
