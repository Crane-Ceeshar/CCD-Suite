import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  // Use service role client for platform-wide access (bypasses RLS)
  const serviceClient = createAdminServiceClient();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '25', 10)));
  const offset = (page - 1) * perPage;

  // Get total count (platform-wide)
  const { count: total } = await serviceClient
    .from('activity_logs')
    .select('id', { count: 'exact', head: true });

  // Get paginated logs (without the broken profiles join)
  const { data: logs, error: queryError } = await serviceClient
    .from('activity_logs')
    .select('id, user_id, action, resource_type, resource_id, details, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  // Batch-fetch profiles for the user_ids in this page of logs
  const userIds = [...new Set((logs ?? []).map((l) => l.user_id).filter(Boolean))];
  let profilesMap: Record<string, { full_name: string; email: string; avatar_url: string | null }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds);

    if (profiles) {
      profilesMap = Object.fromEntries(
        profiles.map((p) => [p.id, { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url }])
      );
    }
  }

  // Merge profiles into logs
  const enrichedLogs = (logs ?? []).map((log) => ({
    id: log.id,
    action: log.action,
    resource_type: log.resource_type,
    resource_id: log.resource_id,
    details: log.details,
    created_at: log.created_at,
    profiles: log.user_id ? profilesMap[log.user_id] ?? null : null,
  }));

  const totalCount = total ?? 0;

  return NextResponse.json({
    success: true,
    data: enrichedLogs,
    pagination: {
      page,
      per_page: perPage,
      total: totalCount,
      total_pages: Math.ceil(totalCount / perPage) || 1,
    },
  });
}
