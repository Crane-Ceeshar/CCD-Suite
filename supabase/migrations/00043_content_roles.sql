-- Content-specific role assignments
-- Hierarchy: writer < editor < reviewer < publisher < admin
CREATE TABLE IF NOT EXISTS content_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('writer', 'editor', 'reviewer', 'publisher', 'admin')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_content_roles_tenant ON content_roles(tenant_id);
CREATE INDEX idx_content_roles_user ON content_roles(user_id);

ALTER TABLE content_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content roles in their tenant"
  ON content_roles FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Admins can manage content roles"
  ON content_roles FOR ALL
  USING (tenant_id = get_current_tenant_id() AND is_admin());

-- Seed: existing admin/owner users get 'admin' content role
INSERT INTO content_roles (tenant_id, user_id, role)
SELECT p.tenant_id, p.id, 'admin'
FROM profiles p
WHERE p.user_type IN ('admin', 'owner')
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Seed: marketing users get 'editor' role
INSERT INTO content_roles (tenant_id, user_id, role)
SELECT p.tenant_id, p.id, 'editor'
FROM profiles p
WHERE p.user_type = 'marketing'
ON CONFLICT (tenant_id, user_id) DO NOTHING;
