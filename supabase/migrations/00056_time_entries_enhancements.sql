-- Phase 5: Time entry enhancements
-- Adds billable, hourly_rate, invoice_id columns and running timer constraint.

-- Add billable column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'billable'
  ) THEN
    ALTER TABLE public.time_entries ADD COLUMN billable boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Add hourly_rate column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE public.time_entries ADD COLUMN hourly_rate numeric(8,2);
  END IF;
END $$;

-- Add invoice_id column if not exists (nullable, for future Finance module)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'time_entries' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE public.time_entries ADD COLUMN invoice_id uuid;
  END IF;
END $$;

-- Partial unique index: enforce max 1 running timer per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_one_running_per_user
  ON public.time_entries (user_id) WHERE is_running = true;

-- Index for querying time entries by date range
CREATE INDEX IF NOT EXISTS idx_time_entries_started_at
  ON public.time_entries (started_at);
