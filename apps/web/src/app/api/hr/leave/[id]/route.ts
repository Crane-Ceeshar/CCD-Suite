import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/hr/leave/:id
 * Fetch a single leave request with employee join.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:leave:get' });
  if (limited) return limitResp!;

  const { data, error: queryError } = await supabase
    .from('leave_requests')
    .select(
      '*, employee:employees(id, first_name, last_name, job_title, department:departments!department_id(id, name))'
    )
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Leave request');
  }

  return success(data);
}
