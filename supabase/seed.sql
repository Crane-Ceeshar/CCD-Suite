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

-- Default pipeline for demo tenant
insert into public.pipelines (id, tenant_id, name, is_default)
values ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Sales Pipeline', true);

insert into public.pipeline_stages (pipeline_id, name, position, color, probability) values
  ('00000000-0000-0000-0000-000000000010', 'Lead', 0, '#94a3b8', 10),
  ('00000000-0000-0000-0000-000000000010', 'Qualified', 1, '#3b82f6', 25),
  ('00000000-0000-0000-0000-000000000010', 'Proposal', 2, '#8b5cf6', 50),
  ('00000000-0000-0000-0000-000000000010', 'Negotiation', 3, '#f59e0b', 75),
  ('00000000-0000-0000-0000-000000000010', 'Closed Won', 4, '#22c55e', 100);

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
