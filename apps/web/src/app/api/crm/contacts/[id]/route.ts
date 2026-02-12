import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateUuid } from '@/lib/api/security';
import { sanitizeObject } from '@/lib/api/sanitize';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Contact');
  if (uuidError) return uuidError;

  const { data, error: queryError } = await supabase
    .from('contacts')
    .select('*, company:companies(id, name)')
    .eq('id', id)
    .single();

  if (queryError) return dbError(queryError, 'Contact');

  // Fetch linked portal projects for this contact
  const { data: portalProjects } = await supabase
    .from('portal_projects')
    .select('id, name, status, created_at')
    .eq('contact_id', id)
    .order('created_at', { ascending: false });

  return success({ ...data, portal_projects: portalProjects ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Contact');
  if (uuidError) return uuidError;

  const body = sanitizeObject(await request.json());

  const { data, error: updateError } = await supabase
    .from('contacts')
    .update({
      ...(body.first_name !== undefined && { first_name: body.first_name }),
      ...(body.last_name !== undefined && { last_name: body.last_name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.job_title !== undefined && { job_title: body.job_title }),
      ...(body.company_id !== undefined && { company_id: body.company_id }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.lead_source !== undefined && { lead_source: body.lead_source }),
      ...(body.lead_status !== undefined && { lead_status: body.lead_status }),
      ...(body.qualification !== undefined && { qualification: body.qualification }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.comment !== undefined && { comment: body.comment }),
    })
    .eq('id', id)
    .select('*, company:companies(id, name)')
    .single();

  if (updateError) return dbError(updateError, 'Contact');

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Contact');
  if (uuidError) return uuidError;

  const { data: deleted, error: deleteError } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (deleteError) return dbError(deleteError, 'Contact');

  return success(deleted);
}
