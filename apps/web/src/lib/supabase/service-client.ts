import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — use only for server-side operations where
 * the caller has already been verified (e.g., portal token verification).
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
