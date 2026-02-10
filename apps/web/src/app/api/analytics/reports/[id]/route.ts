import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * GET /api/analytics/reports/:id
 * Get a single report.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('analytics_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Report');
  }

  return success(data);
}

/**
 * DELETE /api/analytics/reports/:id
 * Delete a report.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { error: deleteError } = await supabase
    .from('analytics_reports')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete report');
  }

  return success({ deleted: true });
}
