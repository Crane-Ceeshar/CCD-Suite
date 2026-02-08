-- ============================================================
-- Migration: Pending Invitations + System Settings RLS fix
-- ============================================================

-- Pending invitations table for team member invites
CREATE TABLE IF NOT EXISTS public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_type text NOT NULL DEFAULT 'client',
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  message text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON public.pending_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.pending_invitations(token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_unique_pending
  ON public.pending_invitations(tenant_id, email) WHERE status = 'pending';

ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- RLS: All tenant users can view invitations
CREATE POLICY "Tenant users can view invitations"
  ON public.pending_invitations FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());

-- RLS: Tenant admins (admin + owner) can insert/update/delete invitations
CREATE POLICY "Tenant admins can manage invitations"
  ON public.pending_invitations FOR ALL
  USING (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin());

-- ============================================================
-- Fix system_settings RLS to allow tenant admins (not just platform admin)
-- ============================================================

-- Drop existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can view system settings" ON public.system_settings;

-- New policy: tenant admins can manage their own system settings
CREATE POLICY "Tenant admins can manage system settings"
  ON public.system_settings FOR ALL
  USING (tenant_id = public.get_current_tenant_id() AND public.is_tenant_admin());

-- New policy: all tenant users can view their tenant's system settings
CREATE POLICY "Tenant users can view system settings"
  ON public.system_settings FOR SELECT
  USING (tenant_id = public.get_current_tenant_id());
