import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, notFound } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/documents/[id]
 * Get a single document by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:documents:get' });
  if (limited) return limitResp!;

  const { data: doc, error: queryError } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Document not found');
  }

  return success(doc);
}

/**
 * DELETE /api/hr/documents/[id]
 * Delete a document.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:documents:delete' });
  if (limited) return limitResp!;

  const { data: doc, error: fetchError } = await supabase
    .from('employee_documents')
    .select('id, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Document not found');
  }

  const { error: deleteError } = await supabase
    .from('employee_documents')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete document');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'document.deleted',
    resource_type: 'employee_document',
    resource_id: id,
    details: { name: doc.name },
  });

  return success({ deleted: true });
}
