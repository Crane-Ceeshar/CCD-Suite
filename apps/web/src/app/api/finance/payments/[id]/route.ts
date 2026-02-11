import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/finance/payments/:id
 * Fetch a single payment by ID with joined invoice data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'finance:payments:get' });
  if (limited) return limitResp!;

  const { id } = await params;

  const { data, error: fetchError } = await supabase
    .from('payments')
    .select('*, invoice:invoices(id, invoice_number, total, status, company:companies(id, name))')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Payment');
  }

  return success(data);
}
