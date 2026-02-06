-- ============================================================
-- SEO Module Schema
-- ============================================================

-- SEO Projects
create table public.seo_projects (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  domain text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger seo_projects_updated_at
  before update on public.seo_projects
  for each row execute function extensions.moddatetime(updated_at);

create index idx_seo_projects_tenant on public.seo_projects (tenant_id);
alter table public.seo_projects enable row level security;

-- SEO Audits
create table public.seo_audits (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.seo_projects(id) on delete cascade,
  score integer check (score >= 0 and score <= 100),
  issues_count integer not null default 0,
  pages_crawled integer not null default 0,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  results jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_seo_audits_project on public.seo_audits (project_id);
create index idx_seo_audits_tenant on public.seo_audits (tenant_id);
alter table public.seo_audits enable row level security;

-- SEO Keywords
create table public.seo_keywords (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.seo_projects(id) on delete cascade,
  keyword text not null,
  search_volume integer,
  difficulty integer check (difficulty >= 0 and difficulty <= 100),
  current_rank integer,
  previous_rank integer,
  target_rank integer,
  url text,
  status text not null default 'tracking' check (status in ('tracking', 'paused', 'achieved')),
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger seo_keywords_updated_at
  before update on public.seo_keywords
  for each row execute function extensions.moddatetime(updated_at);

create index idx_seo_keywords_tenant on public.seo_keywords (tenant_id);
create index idx_seo_keywords_project on public.seo_keywords (project_id);
alter table public.seo_keywords enable row level security;

-- Rank History
create table public.seo_rank_history (
  id uuid primary key default extensions.uuid_generate_v4(),
  keyword_id uuid not null references public.seo_keywords(id) on delete cascade,
  rank integer not null,
  date date not null,
  search_engine text not null default 'google' check (search_engine in ('google', 'bing', 'yahoo')),
  created_at timestamptz not null default now()
);

create index idx_rank_history_keyword on public.seo_rank_history (keyword_id);
create index idx_rank_history_date on public.seo_rank_history (date);
alter table public.seo_rank_history enable row level security;

-- Backlinks
create table public.seo_backlinks (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.seo_projects(id) on delete cascade,
  source_url text not null,
  target_url text not null,
  anchor_text text,
  domain_authority integer,
  status text not null default 'active' check (status in ('active', 'lost', 'pending')),
  discovered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_seo_backlinks_tenant on public.seo_backlinks (tenant_id);
create index idx_seo_backlinks_project on public.seo_backlinks (project_id);
alter table public.seo_backlinks enable row level security;

-- SEO Recommendations
create table public.seo_recommendations (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid not null references public.seo_projects(id) on delete cascade,
  audit_id uuid references public.seo_audits(id) on delete set null,
  type text not null check (type in ('technical', 'content', 'on_page', 'off_page', 'performance')),
  priority text not null default 'medium' check (priority in ('critical', 'high', 'medium', 'low')),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'dismissed')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger seo_recommendations_updated_at
  before update on public.seo_recommendations
  for each row execute function extensions.moddatetime(updated_at);

create index idx_seo_recommendations_tenant on public.seo_recommendations (tenant_id);
create index idx_seo_recommendations_project on public.seo_recommendations (project_id);
alter table public.seo_recommendations enable row level security;

-- ============================================================
-- RLS Policies for SEO tables
-- ============================================================

create policy "Tenant isolation for seo_projects"
  on public.seo_projects for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for seo_audits"
  on public.seo_audits for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for seo_keywords"
  on public.seo_keywords for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for seo_rank_history"
  on public.seo_rank_history for all
  using (
    keyword_id in (
      select id from public.seo_keywords
      where tenant_id = public.get_current_tenant_id()
    )
  );

create policy "Tenant isolation for seo_backlinks"
  on public.seo_backlinks for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for seo_recommendations"
  on public.seo_recommendations for all
  using (tenant_id = public.get_current_tenant_id());
