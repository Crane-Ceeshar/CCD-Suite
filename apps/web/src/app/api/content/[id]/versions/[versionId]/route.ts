import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * GET /api/content/:id/versions/:versionId
 * Get a single version by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id, versionId } = await params;

  const { data, error: queryError } = await supabase
    .from('content_versions')
    .select('*')
    .eq('id', versionId)
    .eq('content_item_id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Version');
  }

  return success(data);
}

/**
 * POST /api/content/:id/versions/:versionId
 * Rollback: copy version data back to the content item.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id, versionId } = await params;

  // Fetch the version to restore
  const { data: version, error: versionError } = await supabase
    .from('content_versions')
    .select('*')
    .eq('id', versionId)
    .eq('content_item_id', id)
    .single();

  if (versionError) {
    return dbError(versionError, 'Version');
  }

  // Copy version data back to the content item
  const { data: updated, error: updateError } = await supabase
    .from('content_items')
    .update({
      title: version.title,
      body: version.body,
      excerpt: version.excerpt,
      metadata: version.metadata,
    })
    .eq('id', id)
    .select('*, category:content_categories(id, name, slug, color)')
    .single();

  if (updateError) {
    return dbError(updateError, 'Failed to rollback content');
  }

  return success(updated);
}
