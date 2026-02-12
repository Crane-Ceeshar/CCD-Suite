import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:contracts:pdf' });
  if (limited) return limitResp!;

  const { data: contract, error: queryError } = await supabase
    .from('contracts')
    .select('*, employee:employees!employee_id(id, first_name, last_name, email, job_title)')
    .eq('id', id)
    .single();

  if (queryError) return dbError(queryError, 'Contract not found');

  return success({ contract, pdf_ready: true });
}
