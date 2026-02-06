-- User profiles linked to Supabase Auth
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  user_type text not null default 'client',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function extensions.moddatetime(updated_at);

-- Indexes
create index idx_profiles_tenant on public.profiles (tenant_id);
create index idx_profiles_user_type on public.profiles (user_type);
create index idx_profiles_email on public.profiles (email);

-- Enable RLS
alter table public.profiles enable row level security;

-- Auto-create profile on signup
-- The tenant_id and user_type are passed as metadata during registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, tenant_id, email, full_name, user_type)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'tenant_id')::uuid,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

comment on table public.profiles is 'Extended user profiles linked to auth.users';
