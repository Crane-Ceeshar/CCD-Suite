-- ============================================================
-- Content Module Schema
-- ============================================================

create table public.content_categories (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  color text,
  created_at timestamptz not null default now(),
  unique(tenant_id, slug)
);

create index idx_content_categories_tenant on public.content_categories (tenant_id);
alter table public.content_categories enable row level security;

create table public.content_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid references public.content_categories(id) on delete set null,
  title text not null,
  slug text not null,
  content_type text not null default 'article' check (content_type in ('article', 'blog_post', 'social_post', 'email', 'landing_page', 'ad_copy', 'video_script')),
  body text,
  excerpt text,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'scheduled', 'published', 'archived')),
  publish_date timestamptz,
  platforms text[] not null default '{}',
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  featured_image_url text,
  metadata jsonb not null default '{}'::jsonb,
  author_id uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger content_items_updated_at
  before update on public.content_items
  for each row execute function extensions.moddatetime(updated_at);

create index idx_content_items_tenant on public.content_items (tenant_id);
create index idx_content_items_status on public.content_items (status);
create index idx_content_items_category on public.content_items (category_id);
create index idx_content_items_publish_date on public.content_items (publish_date);
alter table public.content_items enable row level security;

create table public.content_assets (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  content_item_id uuid references public.content_items(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  url text not null,
  thumbnail_url text,
  alt_text text,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_content_assets_tenant on public.content_assets (tenant_id);
create index idx_content_assets_item on public.content_assets (content_item_id);
alter table public.content_assets enable row level security;

create table public.content_approvals (
  id uuid primary key default extensions.uuid_generate_v4(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id),
  status text not null check (status in ('pending', 'approved', 'rejected', 'changes_requested')),
  comments text,
  created_at timestamptz not null default now()
);

create index idx_content_approvals_item on public.content_approvals (content_item_id);
alter table public.content_approvals enable row level security;

-- RLS Policies
create policy "Tenant isolation for content_categories"
  on public.content_categories for all using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for content_items"
  on public.content_items for all using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for content_assets"
  on public.content_assets for all using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for content_approvals"
  on public.content_approvals for all
  using (content_item_id in (select id from public.content_items where tenant_id = public.get_current_tenant_id()));
