import { NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();

  try {
    // List users via Supabase Auth Admin API
    const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers({
      perPage: 200,
    });

    if (listError) {
      return NextResponse.json(
        { success: false, error: { message: listError.message } },
        { status: 500 }
      );
    }

    // Get profiles for display names
    const userIds = users.map((u) => u.id);
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, full_name, email, user_type, is_active')
      .in('id', userIds);

    const profilesMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p])
    );

    // Build session list — show users who signed in within last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const sessions = users
      .filter((u) => u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo)
      .map((u) => ({
        user_id: u.id,
        email: u.email,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        profile: profilesMap[u.id] ?? null,
      }))
      .sort((a, b) => {
        const aTime = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        const bTime = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
        return bTime - aTime;
      });

    return NextResponse.json({ success: true, data: sessions });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err instanceof Error ? err.message : 'Failed to list sessions' } },
      { status: 500 }
    );
  }
}
