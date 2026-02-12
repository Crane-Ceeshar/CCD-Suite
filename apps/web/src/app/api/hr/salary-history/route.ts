import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, error as apiError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/hr/salary-history
 * Get salary history for an employee, ordered by effective_date desc.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:salary-history:list' });
  if (limited) return limitResp!;

  const employeeId = request.nextUrl.searchParams.get('employee_id');
  if (!employeeId) {
    return apiError('employee_id is required', 400);
  }

  const { data, error: queryError } = await supabase
    .from('salary_history')
    .select('*')
    .eq('employee_id', employeeId)
    .order('effective_date', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch salary history');
  }

  return NextResponse.json({ success: true, data });
}
