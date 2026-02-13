-- ============================================================
-- Knowledge Base storage bucket
-- Missed from the AI Knowledge Base migration (20260214000006)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-base',
  'knowledge-base',
  false,
  104857600, -- 100MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'application/msword', -- .doc
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/rtf',
    'application/json',
    'application/xml',
    'text/xml'
  ]
);

-- Storage policies for knowledge-base bucket

CREATE POLICY "KB docs authenticated read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'knowledge-base'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "KB docs authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'knowledge-base'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "KB docs authenticated delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'knowledge-base'
    AND auth.role() = 'authenticated'
  );
