-- Fix: ensure time_entries has billable, hourly_rate, and invoice_id columns
-- These may have been missed if migration 00056 ran before the table had data

ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS billable boolean DEFAULT true NOT NULL;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS hourly_rate numeric(8,2);
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS invoice_id uuid;

-- Ensure the running timer unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_one_running_per_user
  ON public.time_entries (user_id) WHERE is_running = true;

-- Also ensure tasks has sprint_id and story_points (from 00058)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sprint_id uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS story_points integer;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date date;

-- Ensure projects has currency and client_id (from 00055)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id uuid;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
