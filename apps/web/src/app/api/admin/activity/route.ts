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
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  // Get total count (platform-wide) with optional date filtering
  let countQuery = serviceClient
    .from('activity_logs')
    .select('id', { count: 'exact', head: true });
  if (startDate) countQuery = countQuery.gte('created_at', `${startDate}T00:00:00.000Z`);
  if (endDate) countQuery = countQuery.lte('created_at', `${endDate}T23:59:59.999Z`);
  const { count: total } = await countQuery;

  // Get paginated logs with optional date filtering
  let logsQuery = serviceClient
    .from('activity_logs')
    .select('id, user_id, action, resource_type, resource_id, details, created_at')
    .order('created_at', { ascending: false });
  if (startDate) logsQuery = logsQuery.gte('created_at', `${startDate}T00:00:00.000Z`);
  if (endDate) logsQuery = logsQuery.lte('created_at', `${endDate}T23:59:59.999Z`);
  const { data: logs, error: queryError } = await logsQuery
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
