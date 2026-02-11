-- Fix: Apply the started_at index that was skipped when 00056 partially failed
CREATE INDEX IF NOT EXISTS idx_time_entries_started_at
  ON public.time_entries (started_at);
