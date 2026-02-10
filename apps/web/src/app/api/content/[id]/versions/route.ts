import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { z } from 'zod';

const manualSnapshotSchema = z.object({
  snapshot_reason: z.string().max(500).default('manual'),
});

/**
 * GET /api/content/:id/versions
 * List all versions for a content item, newest first.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('content_versions')
    .select('*')
    .eq('content_item_id', id)
    .order('version_number', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch versions');
  }

  return success(data ?? []);
}

/**
 * POST /api/content/:id/versions
 * Create a manual snapshot of the current content state.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: body, error: bodyError } = await validateBody(request, manualSnapshotSchema);
  if (bodyError) return bodyError;

  // Fetch current content item
  const { data: item, error: itemError } = await supabase
    .from('content_items')
    .select('id, title, body, excerpt, metadata, status')
    .eq('id', id)
    .single();

  if (itemError) {
    return dbError(itemError, 'Content item');
  }

  // Get next version number
  const { data: maxVersion } = await supabase
    .from('content_versions')
    .select('version_number')
    .eq('content_item_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (maxVersion?.version_number ?? 0) + 1;

  const { data: version, error: insertError } = await supabase
    .from('content_versions')
    .insert({
      content_item_id: id,
      version_number: nextVersion,
      title: item.title,
      body: item.body,
      excerpt: item.excerpt,
      metadata: item.metadata,
      status: item.status,
      created_by: user.id,
      snapshot_reason: body.snapshot_reason,
    })
    .select('*')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create version');
  }

  return success(version, 201);
}
