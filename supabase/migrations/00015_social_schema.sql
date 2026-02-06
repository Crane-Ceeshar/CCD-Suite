-- ============================================================
-- Social Media Module Schema
-- ============================================================

-- Social Campaigns (created before posts so posts can reference)
create table public.social_campaigns (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  tags text[] not null default '{}',
  budget numeric(10,2),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger social_campaigns_updated_at
  before update on public.social_campaigns
  for each row execute function extensions.moddatetime(updated_at);

create index idx_social_campaigns_tenant on public.social_campaigns (tenant_id);
alter table public.social_campaigns enable row level security;

-- Social Accounts
create table public.social_accounts (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  platform text not null check (platform in ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube')),
  account_name text not null,
  account_id text,
  avatar_url text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'disconnected', 'expired')),
  metadata jsonb not null default '{}'::jsonb,
  connected_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger social_accounts_updated_at
  before update on public.social_accounts
  for each row execute function extensions.moddatetime(updated_at);

create index idx_social_accounts_tenant on public.social_accounts (tenant_id);
create index idx_social_accounts_platform on public.social_accounts (platform);
alter table public.social_accounts enable row level security;

-- Social Posts
create table public.social_posts (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  content text,
  media_urls text[] not null default '{}',
  platforms text[] not null default '{}',
  scheduled_at timestamptz,
  published_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  account_ids uuid[] not null default '{}',
  campaign_id uuid references public.social_campaigns(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger social_posts_updated_at
  before update on public.social_posts
  for each row execute function extensions.moddatetime(updated_at);

create index idx_social_posts_tenant on public.social_posts (tenant_id);
create index idx_social_posts_status on public.social_posts (status);
create index idx_social_posts_scheduled on public.social_posts (scheduled_at);
create index idx_social_posts_campaign on public.social_posts (campaign_id);
alter table public.social_posts enable row level security;

-- Social Engagement (metrics per post)
create table public.social_engagement (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  post_id uuid not null references public.social_posts(id) on delete cascade,
  platform text not null,
  likes integer not null default 0,
  comments integer not null default 0,
  shares integer not null default 0,
  impressions integer not null default 0,
  reach integer not null default 0,
  clicks integer not null default 0,
  engagement_rate numeric(5,2),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_social_engagement_tenant on public.social_engagement (tenant_id);
create index idx_social_engagement_post on public.social_engagement (post_id);
alter table public.social_engagement enable row level security;

-- Social Comments (incoming comments from social platforms)
create table public.social_comments (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  post_id uuid references public.social_posts(id) on delete set null,
  platform text not null,
  external_id text,
  author_name text,
  author_avatar text,
  content text not null,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  replied boolean not null default false,
  reply_content text,
  metadata jsonb not null default '{}'::jsonb,
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_social_comments_tenant on public.social_comments (tenant_id);
create index idx_social_comments_post on public.social_comments (post_id);
create index idx_social_comments_sentiment on public.social_comments (sentiment);
alter table public.social_comments enable row level security;

-- ============================================================
-- RLS Policies for Social Media tables
-- ============================================================

create policy "Tenant isolation for social_campaigns"
  on public.social_campaigns for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for social_accounts"
  on public.social_accounts for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for social_posts"
  on public.social_posts for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for social_engagement"
  on public.social_engagement for all
  using (tenant_id = public.get_current_tenant_id());

create policy "Tenant isolation for social_comments"
  on public.social_comments for all
  using (tenant_id = public.get_current_tenant_id());
