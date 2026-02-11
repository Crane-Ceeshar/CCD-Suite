-- Phase 8: Portal notifications table

CREATE TABLE IF NOT EXISTS public.portal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  portal_project_id uuid REFERENCES public.portal_projects(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email text,
  type text NOT NULL CHECK (type IN ('milestone_update', 'deliverable_uploaded', 'message_received', 'project_update')),
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portal_notifications_tenant ON public.portal_notifications (tenant_id);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_recipient ON public.portal_notifications (recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_project ON public.portal_notifications (portal_project_id);

-- RLS
ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portal_notifications' AND policyname = 'portal_notifications_tenant_isolation'
  ) THEN
    CREATE POLICY portal_notifications_tenant_isolation ON public.portal_notifications
      FOR ALL
      USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
      WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
  END IF;
END $$;
