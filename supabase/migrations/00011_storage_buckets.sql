-- ============================================================
-- Storage Buckets
-- ============================================================

-- Avatars bucket (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Content assets bucket (private)
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'content-assets',
  'content-assets',
  false,
  209715200 -- 200MB
);

-- Project files bucket (private)
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'project-files',
  'project-files',
  false,
  524288000 -- 500MB
);

-- Storage policies

-- Avatars: anyone can read, authenticated users can upload their own
create policy "Avatar public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Avatar authenticated upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

create policy "Avatar owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Content assets: tenant-scoped access
create policy "Content assets tenant read"
  on storage.objects for select
  using (
    bucket_id = 'content-assets'
    and auth.role() = 'authenticated'
  );

create policy "Content assets tenant upload"
  on storage.objects for insert
  with check (
    bucket_id = 'content-assets'
    and auth.role() = 'authenticated'
  );

-- Project files: tenant-scoped access
create policy "Project files tenant read"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and auth.role() = 'authenticated'
  );

create policy "Project files tenant upload"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and auth.role() = 'authenticated'
  );
