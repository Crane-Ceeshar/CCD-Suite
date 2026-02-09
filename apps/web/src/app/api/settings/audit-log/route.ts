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

  // Fetch logs without FK join (activity_logs.user_id references auth.users, not profiles)
  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
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

  // Extract unique user IDs and batch-fetch profiles
  const userIds = [...new Set((logs ?? []).map((l) => l.user_id).filter(Boolean))] as string[];
  const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    for (const p of profiles ?? []) {
      profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    }
  }

  // Enrich logs with user_name and user_avatar
  const enrichedLogs = (logs ?? []).map((log) => {
    const userProfile = log.user_id ? profileMap[log.user_id] : null;
    return {
      ...log,
      user_name: userProfile?.full_name ?? null,
      user_avatar: userProfile?.avatar_url ?? null,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      logs: enrichedLogs,
      total: count ?? 0,
      page,
      limit,
    },
  });
}
