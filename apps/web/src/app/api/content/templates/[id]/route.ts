import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { templateUpdateSchema } from '@/lib/api/schemas/content';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('content_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) return dbError(queryError, 'Template');

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { data: body, error: bodyError } = await validateBody(request, templateUpdateSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.content_type !== undefined) updateFields.content_type = body.content_type;
  if (body.body_template !== undefined) updateFields.body_template = body.body_template;
  if (body.metadata_template !== undefined) updateFields.metadata_template = body.metadata_template;

  const { data, error: updateError } = await supabase
    .from('content_templates')
    .update(updateFields)
    .eq('id', id)
    .eq('is_system', false)
    .select()
    .single();

  if (updateError) return dbError(updateError, 'Template');

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { error: deleteError } = await supabase
    .from('content_templates')
    .delete()
    .eq('id', id)
    .eq('is_system', false);

  if (deleteError) return dbError(deleteError, 'Template');

  return success(null);
}
