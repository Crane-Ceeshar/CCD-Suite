-- ============================================================
-- AI Module Schema
-- ============================================================

-- AI Conversations
create table public.ai_conversations (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  module_context text,
  status text not null default 'active' check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_conversations_updated_at
  before update on public.ai_conversations
  for each row execute function extensions.moddatetime(updated_at);

create index idx_ai_conversations_tenant on public.ai_conversations (tenant_id);
create index idx_ai_conversations_user on public.ai_conversations (user_id);
create index idx_ai_conversations_status on public.ai_conversations (status);
alter table public.ai_conversations enable row level security;

-- AI Messages
create table public.ai_messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used integer,
  model text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_ai_messages_conversation on public.ai_messages (conversation_id);
create index idx_ai_messages_created on public.ai_messages (created_at);
alter table public.ai_messages enable row level security;

-- AI Generation Jobs
create table public.ai_generation_jobs (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('blog_post', 'social_caption', 'ad_copy', 'email_draft', 'seo_description', 'summary', 'custom')),
  prompt text not null,
  result text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  model text,
  tokens_used integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_generation_jobs_updated_at
  before update on public.ai_generation_jobs
  for each row execute function extensions.moddatetime(updated_at);

create index idx_ai_generation_jobs_tenant on public.ai_generation_jobs (tenant_id);
create index idx_ai_generation_jobs_user on public.ai_generation_jobs (user_id);
create index idx_ai_generation_jobs_status on public.ai_generation_jobs (status);
alter table public.ai_generation_jobs enable row level security;

-- AI Settings (per tenant)
create table public.ai_settings (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  preferred_model text not null default 'claude-sonnet-4-20250514',
  max_tokens_per_request integer not null default 4096,
  monthly_token_budget integer not null default 1000000,
  monthly_tokens_used integer not null default 0,
  features_enabled jsonb not null default '{"chat": true, "content_generation": true, "insights": true, "automations": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_settings_tenant_unique unique (tenant_id)
);

create trigger ai_settings_updated_at
  before update on public.ai_settings
  for each row execute function extensions.moddatetime(updated_at);

create index idx_ai_settings_tenant on public.ai_settings (tenant_id);
alter table public.ai_settings enable row level security;

-- AI Insights
create table public.ai_insights (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category text not null check (category in ('crm', 'analytics', 'seo', 'finance', 'social')),
  type text not null check (type in ('deal_score', 'sales_forecast', 'anomaly_detection', 'trend_narration', 'keyword_suggestion', 'expense_categorization', 'sentiment_analysis', 'general')),
  title text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  entity_id uuid,
  entity_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_ai_insights_tenant on public.ai_insights (tenant_id);
create index idx_ai_insights_category on public.ai_insights (category);
create index idx_ai_insights_type on public.ai_insights (type);
create index idx_ai_insights_is_read on public.ai_insights (tenant_id, is_read);
alter table public.ai_insights enable row level security;

-- AI Automations
create table public.ai_automations (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  type text not null check (type in ('expense_categorization', 'seo_recommendations', 'sentiment_analysis', 'deal_scoring', 'content_suggestions')),
  name text not null,
  description text not null default '',
  is_enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ai_automations_updated_at
  before update on public.ai_automations
  for each row execute function extensions.moddatetime(updated_at);

create index idx_ai_automations_tenant on public.ai_automations (tenant_id);
create index idx_ai_automations_type on public.ai_automations (type);
create index idx_ai_automations_enabled on public.ai_automations (tenant_id, is_enabled);
alter table public.ai_automations enable row level security;

-- ============================================================
-- RLS Policies for AI tables
-- ============================================================

-- Conversations: users see only their own within their tenant
create policy "Tenant isolation for ai_conversations"
  on public.ai_conversations for all
  using (
    tenant_id = public.get_current_tenant_id()
    and user_id = auth.uid()
  );

-- Messages: accessible if user owns the parent conversation
create policy "Owner access for ai_messages"
  on public.ai_messages for all
  using (
    conversation_id in (
      select id from public.ai_conversations
      where tenant_id = public.get_current_tenant_id()
        and user_id = auth.uid()
    )
  );

-- Generation jobs: users see only their own within their tenant
create policy "Tenant isolation for ai_generation_jobs"
  on public.ai_generation_jobs for all
  using (
    tenant_id = public.get_current_tenant_id()
    and user_id = auth.uid()
  );

-- Settings: tenant isolation (all tenant members can read)
create policy "Tenant isolation for ai_settings"
  on public.ai_settings for all
  using (tenant_id = public.get_current_tenant_id());

-- Insights: tenant isolation (all tenant members can read)
create policy "Tenant isolation for ai_insights"
  on public.ai_insights for all
  using (tenant_id = public.get_current_tenant_id());

-- Automations: tenant isolation (all tenant members can read)
create policy "Tenant isolation for ai_automations"
  on public.ai_automations for all
  using (tenant_id = public.get_current_tenant_id());
