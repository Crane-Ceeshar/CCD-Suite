import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const { data: users, error: queryError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, user_type, is_active, created_at')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: users });
}
