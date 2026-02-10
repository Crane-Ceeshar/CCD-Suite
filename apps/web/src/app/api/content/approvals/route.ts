import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, error } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { approvalCreateSchema } from '@/lib/api/schemas/content';

/**
 * GET /api/content/approvals
 * List content approvals with tab-based filtering.
 * Query params:
 *   ?tab=pending  – approvals where reviewer_id = current user and status = 'pending'
 *   ?tab=submitted – approvals where content item's created_by = current user
 *   ?tab=all – all approvals for the tenant
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') ?? 'pending';

  let query = supabase
    .from('content_approvals')
    .select('*, content_item:content_items(id, title, content_type, status, created_by)')
    .order('created_at', { ascending: false });

  if (tab === 'pending') {
    query = query
      .eq('reviewer_id', user.id)
      .eq('status', 'pending');
  } else if (tab === 'submitted') {
    query = query.eq('content_item.created_by', user.id);
  }
  // 'all' — no additional filters, returns all approvals for tenant (RLS handles tenant scoping)

  const { data, error: queryError } = await query;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch approvals');
  }

  // For 'submitted' tab, filter out rows where the join didn't match (content_item is null)
  const filtered = tab === 'submitted'
    ? (data ?? []).filter((row: Record<string, unknown>) => row.content_item !== null)
    : data;

  return success(filtered);
}

/**
 * POST /api/content/approvals
 * Submit a content item for review.
 * Body: { content_item_id: string, reviewer_id?: string }
 *
 * Prevents duplicate pending approvals for the same content item by the same reviewer.
 */
export async function POST(request: NextRequest) {
  const { error: authError, supabase, profile } = await requireAuth();
  if (authError) return authError;

  const { data: body, error: bodyError } = await validateBody(request, approvalCreateSchema);
  if (bodyError) return bodyError;

  // Check for existing pending approval for the same content item by the same reviewer
  if (body.reviewer_id) {
    const { data: existing } = await supabase
      .from('content_approvals')
      .select('id')
      .eq('content_item_id', body.content_item_id)
      .eq('reviewer_id', body.reviewer_id)
      .eq('status', 'pending')
      .limit(1);

    if (existing && existing.length > 0) {
      return error(
        'A pending approval already exists for this content item and reviewer',
        409
      );
    }
  }

  // Create the approval record
  const { data: approval, error: insertError } = await supabase
    .from('content_approvals')
    .insert({
      content_item_id: body.content_item_id,
      reviewer_id: body.reviewer_id ?? null,
      status: 'pending',
      tenant_id: profile.tenant_id,
    })
    .select('*, content_item:content_items(id, title, content_type, status, created_by)')
    .single();

  if (insertError) {
    // The partial unique index will also catch duplicates at the DB level
    return dbError(insertError, 'Failed to create approval');
  }

  // Update the content item status to 'review'
  const { error: updateError } = await supabase
    .from('content_items')
    .update({ status: 'review' })
    .eq('id', body.content_item_id);

  if (updateError) {
    return dbError(updateError, 'Failed to update content status');
  }

  return success(approval, 201);
}
