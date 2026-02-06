-- ============================================================
-- Seed data for development
-- ============================================================

-- Demo tenant
insert into public.tenants (id, name, slug, plan, max_users, settings)
values (
  '00000000-0000-0000-0000-000000000001',
  'CCD Demo Agency',
  'ccd-demo',
  'enterprise',
  50,
  '{
    "modules_enabled": ["crm", "analytics", "content", "seo", "social", "client_portal", "projects", "finance", "hr"],
    "features": {
      "ai_enabled": true,
      "custom_branding": true
    }
  }'::jsonb
);

-- Predefined user type definitions for demo tenant
insert into public.user_type_definitions (tenant_id, name, slug, description, modules, is_system)
values
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin',
   'Full access to all modules',
   array['crm', 'analytics', 'content', 'seo', 'social', 'client_portal', 'projects', 'finance', 'hr'],
   true),
  ('00000000-0000-0000-0000-000000000001', 'Sales', 'sales',
   'Access to CRM and Analytics',
   array['crm', 'analytics'],
   true),
  ('00000000-0000-0000-0000-000000000001', 'Marketing', 'marketing',
   'Access to Content, SEO, Social Media, and Analytics',
   array['content', 'seo', 'social', 'analytics'],
   true),
  ('00000000-0000-0000-0000-000000000001', 'Project Manager', 'project_manager',
   'Access to Projects and Analytics',
   array['projects', 'analytics'],
   true),
  ('00000000-0000-0000-0000-000000000001', 'Finance', 'finance',
   'Access to Finance and Analytics',
   array['finance', 'analytics'],
   true),
  ('00000000-0000-0000-0000-000000000001', 'HR', 'hr',
   'Access to HR and Analytics',
   array['hr', 'analytics'],
   true),
  ('00000000-0000-0000-0000-000000000001', 'Client', 'client',
   'Access to Client Portal only',
   array['client_portal'],
   true);
