import { NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Use service role client for platform-wide user listing (bypasses RLS)
  const serviceClient = createAdminServiceClient();

  const { data: users, error: queryError } = await serviceClient
    .from('profiles')
    .select('id, email, full_name, avatar_url, user_type, is_active, created_at, tenants(name)')
    .order('created_at', { ascending: false });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: users });
}
