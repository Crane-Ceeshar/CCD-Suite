import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { activityListQuerySchema } from '@/lib/api/schemas/notifications';

/**
 * GET /api/activity
 * List activity log entries for the current tenant.
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase, profile } = await requireAuth();
  if (authError) return authError;

  const { data: query, error: queryError } = validateQuery(
    request.nextUrl.searchParams,
    activityListQuerySchema
  );
  if (queryError) return queryError;

  const { page, limit, module, from, to } = query;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (module) {
    dbQuery = dbQuery.contains('details', { module });
  }

  if (from) {
    dbQuery = dbQuery.gte('created_at', from);
  }

  if (to) {
    dbQuery = dbQuery.lte('created_at', to);
  }

  const { data, error: fetchError, count } = await dbQuery;

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch activity logs');
  }

  // Enrich logs with user profile info
  const userIds = [...new Set((data ?? []).map((l) => l.user_id).filter(Boolean))] as string[];
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

  const enrichedLogs = (data ?? []).map((log) => {
    const userProfile = log.user_id ? profileMap[log.user_id] : null;
    return {
      ...log,
      user_name: userProfile?.full_name ?? null,
      user_avatar: userProfile?.avatar_url ?? null,
    };
  });

  return success({
    activities: enrichedLogs,
    total: count ?? 0,
    page,
    limit,
  });
}
