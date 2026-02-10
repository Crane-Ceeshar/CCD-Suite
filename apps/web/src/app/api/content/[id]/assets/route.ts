import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { assetCreateSchema } from '@/lib/api/schemas/content';

/**
 * GET /api/content/:id/assets
 * List assets for a content item.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('content_assets')
    .select('*')
    .eq('content_item_id', id)
    .order('created_at', { ascending: false });

  if (queryError) return dbError(queryError, 'Asset');

  return success(data);
}

/**
 * POST /api/content/:id/assets
 * Associate an uploaded file with a content item.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { data: body, error: bodyError } = await validateBody(request, assetCreateSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('content_assets')
    .insert({
      tenant_id: profile.tenant_id,
      content_item_id: id,
      file_name: body.file_name,
      file_type: body.file_type,
      file_size: body.file_size,
      url: body.url,
      thumbnail_url: body.thumbnail_url ?? null,
      alt_text: body.alt_text ?? null,
      metadata: body.metadata,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) return dbError(insertError, 'Asset');

  return success(data, 201);
}
