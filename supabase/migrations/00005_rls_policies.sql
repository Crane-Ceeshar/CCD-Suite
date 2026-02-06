-- ============================================================
-- Helper functions for RLS
-- ============================================================

-- Get the current user's tenant_id from their profile
create or replace function public.get_current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tenant_id
  from public.profiles
  where id = auth.uid()
$$;

-- Get the current user's user_type from their profile
create or replace function public.get_current_user_type()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select user_type
  from public.profiles
  where id = auth.uid()
$$;

-- Check if the current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select user_type = 'admin'
  from public.profiles
  where id = auth.uid()
$$;

-- ============================================================
-- Tenants policies
-- ============================================================

-- Users can read their own tenant
create policy "Users can view own tenant"
  on public.tenants for select
  using (id = public.get_current_tenant_id());

-- Only admins can update their tenant
create policy "Admins can update own tenant"
  on public.tenants for update
  using (id = public.get_current_tenant_id() and public.is_admin());

-- ============================================================
-- Profiles policies
-- ============================================================

-- Users can read profiles in their tenant
create policy "Users can view tenant profiles"
  on public.profiles for select
  using (tenant_id = public.get_current_tenant_id());

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Admins can update any profile in their tenant
create policy "Admins can update tenant profiles"
  on public.profiles for update
  using (
    tenant_id = public.get_current_tenant_id()
    and public.is_admin()
  );

-- Admins can insert profiles (invite users)
create policy "Admins can insert tenant profiles"
  on public.profiles for insert
  with check (
    tenant_id = public.get_current_tenant_id()
    and public.is_admin()
  );

-- ============================================================
-- User type definitions policies
-- ============================================================

-- Users can read user type definitions in their tenant
create policy "Users can view tenant user types"
  on public.user_type_definitions for select
  using (tenant_id = public.get_current_tenant_id());

-- Only admins can manage user type definitions
create policy "Admins can insert user types"
  on public.user_type_definitions for insert
  with check (
    tenant_id = public.get_current_tenant_id()
    and public.is_admin()
  );

create policy "Admins can update user types"
  on public.user_type_definitions for update
  using (
    tenant_id = public.get_current_tenant_id()
    and public.is_admin()
    and not is_system
  );

create policy "Admins can delete user types"
  on public.user_type_definitions for delete
  using (
    tenant_id = public.get_current_tenant_id()
    and public.is_admin()
    and not is_system
  );
