import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';

export async function GET(request: NextRequest) {
  const { error, supabase, profile } = await requireTenantAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
  const action = searchParams.get('action');
  const userId = searchParams.get('user_id');
  const resourceType = searchParams.get('resource_type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const search = searchParams.get('search');

  const offset = (page - 1) * limit;

  let query = supabase
    .from('activity_logs')
    .select('*, profile:profiles!activity_logs_user_id_fkey(full_name, avatar_url)', { count: 'exact' })
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq('action', action);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }

  if (from) {
    query = query.gte('created_at', from);
  }

  if (to) {
    query = query.lte('created_at', to);
  }

  if (search) {
    query = query.or(`action.ilike.%${search}%,details::text.ilike.%${search}%`);
  }

  const { data: logs, error: queryError, count } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: logs,
    count,
    page,
    limit,
  });
}
