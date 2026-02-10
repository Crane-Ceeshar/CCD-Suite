import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { categoryUpdateSchema } from '@/lib/api/schemas/content';

/**
 * PATCH /api/content/categories/[id]
 * Update a content category (name, slug, color).
 * Auto-generates slug from name if name changes and no explicit slug is provided.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data: body, error: bodyError } = await validateBody(request, categoryUpdateSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};

  if (body.name !== undefined) {
    updateFields.name = body.name;
    // Auto-generate slug from name unless an explicit slug is provided
    if (body.slug === undefined) {
      updateFields.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }

  if (body.slug !== undefined) updateFields.slug = body.slug;
  if (body.color !== undefined) updateFields.color = body.color;

  if (Object.keys(updateFields).length === 0) {
    return error('No valid fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('content_categories')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) return dbError(updateError, 'Category');

  return success(data);
}

/**
 * DELETE /api/content/categories/[id]
 * Delete a content category.
 * Supabase handles cascade or nullifying content_items.category_id.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { error: deleteError } = await supabase
    .from('content_categories')
    .delete()
    .eq('id', id);

  if (deleteError) return dbError(deleteError, 'Category');

  return success(null);
}
