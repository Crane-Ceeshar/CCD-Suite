import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateQuery } from '@/lib/api/validate';
import { z } from 'zod';

const completionTrendsQuerySchema = z.object({
  period: z.enum(['week', 'month']).default('week'),
  count: z
    .string()
    .default('12')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(52)),
});

/**
 * GET /api/projects/analytics/completion-trends
 * Task completion and creation over time — weekly or monthly buckets.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'projects:analytics:trends' });
  if (limited) return limitResp!;

  const { data: query, error: queryError } = validateQuery(
    request.nextUrl.searchParams,
    completionTrendsQuerySchema
  );
  if (queryError) return queryError;

  const { period, count } = query;

  // Calculate the start date based on period and count
  const now = new Date();
  let startDate: Date;

  if (period === 'week') {
    // Go back `count` weeks from the start of the current ISO week (Monday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + mondayOffset);
    currentMonday.setHours(0, 0, 0, 0);
    startDate = new Date(currentMonday);
    startDate.setDate(startDate.getDate() - (count - 1) * 7);
  } else {
    // Go back `count` months from the start of the current month
    startDate = new Date(now.getFullYear(), now.getMonth() - (count - 1), 1);
  }

  const startIso = startDate.toISOString();

  // Fetch tasks created since start date and done tasks updated since start date in parallel
  const [createdRes, doneRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, created_at')
      .gte('created_at', startIso),
    supabase
      .from('tasks')
      .select('id, updated_at')
      .eq('status', 'done')
      .gte('updated_at', startIso),
  ]);

  if (createdRes.error) {
    return dbError(createdRes.error, 'Failed to fetch task data');
  }

  const createdTasks = createdRes.data ?? [];
  const doneTasks = doneRes.data ?? [];

  // Build period buckets
  interface Bucket {
    period: string;
    completed: number;
    created: number;
  }

  const buckets: Bucket[] = [];

  if (period === 'week') {
    // Build weekly buckets starting from startDate (which is a Monday)
    const cursor = new Date(startDate);
    for (let i = 0; i < count; i++) {
      const weekStart = new Date(cursor);
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStartStr = weekStart.toISOString().slice(0, 10);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);

      const created = createdTasks.filter((t: { created_at: string }) => {
        const d = t.created_at.slice(0, 10);
        return d >= weekStartStr && d <= weekEndStr;
      }).length;

      const completed = doneTasks.filter((t: { updated_at: string }) => {
        const d = t.updated_at.slice(0, 10);
        return d >= weekStartStr && d <= weekEndStr;
      }).length;

      buckets.push({ period: weekStartStr, completed, created });
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    // Build monthly buckets
    const cursor = new Date(startDate);
    for (let i = 0; i < count; i++) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

      const created = createdTasks.filter((t: { created_at: string }) => {
        return t.created_at.slice(0, 7) === monthStr;
      }).length;

      const completed = doneTasks.filter((t: { updated_at: string }) => {
        return t.updated_at.slice(0, 7) === monthStr;
      }).length;

      buckets.push({ period: monthStr, completed, created });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return success(buckets);
}
