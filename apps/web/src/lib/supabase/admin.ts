import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createServiceRoleClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCookieDomain } from './cookie-domain';

/**
 * Creates an authenticated Supabase client and verifies the user is an admin.
 * Returns the supabase client, user, and profile.
 * Used in all /api/admin/* route handlers.
 */
export async function requireAdmin() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            const domain = getCookieDomain();
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, domain })
            );
          } catch {
            // Called from Server Component — ignored
          }
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      ),
      supabase: null as never,
      user: null as never,
      profile: null as never,
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, user_type, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.user_type !== 'admin') {
    return {
      error: NextResponse.json(
        { success: false, error: { message: 'Forbidden — admin access required' } },
        { status: 403 }
      ),
      supabase: null as never,
      user: null as never,
      profile: null as never,
    };
  }

  return { error: null, supabase, user, profile };
}

/**
 * Creates a Supabase client with the service role key.
 * Used for elevated operations like creating auth users (invites).
 * ONLY call this after verifying admin access via requireAdmin().
 */
export function createAdminServiceClient() {
  return createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
