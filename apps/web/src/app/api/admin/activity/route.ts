import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '25', 10)));
  const offset = (page - 1) * perPage;

  // Get total count
  const { count: total } = await supabase
    .from('activity_logs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id);

  // Get paginated logs with user profile info
  const { data: logs, error: queryError } = await supabase
    .from('activity_logs')
    .select('id, action, resource_type, resource_id, details, created_at, profiles(full_name, email, avatar_url)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  const totalCount = total ?? 0;

  return NextResponse.json({
    success: true,
    data: logs ?? [],
    pagination: {
      page,
      per_page: perPage,
      total: totalCount,
      total_pages: Math.ceil(totalCount / perPage),
    },
  });
}
