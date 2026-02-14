import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCookieDomain } from './cookie-domain';

// Re-export the service client for convenience
export { createAdminServiceClient } from './admin';

/**
 * Creates an authenticated Supabase client and verifies the user is a tenant admin.
 * Allows both 'admin' (platform) and 'owner' (tenant) user types.
 * Used in tenant-level management routes (team, roles, settings).
 */
export async function requireTenantAdmin() {
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
    .select('id, email, full_name, user_type, tenant_id, role_title')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'owner'].includes(profile.user_type)) {
    return {
      error: NextResponse.json(
        { success: false, error: { message: 'Forbidden — admin or owner access required' } },
        { status: 403 }
      ),
      supabase: null as never,
      user: null as never,
      profile: null as never,
    };
  }

  return { error: null, supabase, user, profile };
}
