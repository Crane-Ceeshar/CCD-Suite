import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? '30d';
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Fetch raw data in parallel
  const [allProfiles, periodProfiles, periodActivity, totalActivity] = await Promise.all([
    // Total users
    serviceClient
      .from('profiles')
      .select('id', { count: 'exact', head: true }),

    // Profiles created in period
    serviceClient
      .from('profiles')
      .select('id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),

    // Activity logs in period
    serviceClient
      .from('activity_logs')
      .select('user_id, resource_type, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),

    // Total activity count in period
    serviceClient
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since),
  ]);

  // Aggregate user growth by week
  const userGrowth = aggregateByWeek(
    (periodProfiles.data ?? []).map((p) => p.created_at)
  );

  // Aggregate active users by day (distinct user_ids per day)
  const activityByDay = aggregateActiveUsersByDay(
    (periodActivity.data ?? []).map((a) => ({ user_id: a.user_id, created_at: a.created_at }))
  );

  // Aggregate activity by resource type
  const activityByType: Record<string, number> = {};
  for (const a of periodActivity.data ?? []) {
    activityByType[a.resource_type] = (activityByType[a.resource_type] || 0) + 1;
  }
  const activityByTypeArray = Object.entries(activityByType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Distinct active users in period
  const activeUserIds = new Set(
    (periodActivity.data ?? []).map((a) => a.user_id).filter(Boolean)
  );

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        total_users: allProfiles.count ?? 0,
        new_users: periodProfiles.data?.length ?? 0,
        active_users: activeUserIds.size,
        total_activity: totalActivity.count ?? 0,
      },
      user_growth: userGrowth,
      active_users_trend: activityByDay,
      activity_by_type: activityByTypeArray,
    },
  });
}

function aggregateByWeek(dates: string[]): Array<{ period: string; count: number }> {
  const weeks: Record<string, number> = {};
  for (const dateStr of dates) {
    const d = new Date(dateStr);
    // Get Monday of the week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);
    const key = monday.toISOString().split('T')[0];
    weeks[key] = (weeks[key] || 0) + 1;
  }
  return Object.entries(weeks)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function aggregateActiveUsersByDay(
  entries: Array<{ user_id: string; created_at: string }>
): Array<{ period: string; count: number }> {
  const days: Record<string, Set<string>> = {};
  for (const entry of entries) {
    const key = entry.created_at.split('T')[0];
    if (!days[key]) days[key] = new Set();
    if (entry.user_id) days[key].add(entry.user_id);
  }
  return Object.entries(days)
    .map(([period, users]) => ({ period, count: users.size }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
