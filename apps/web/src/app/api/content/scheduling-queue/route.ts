import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { schedulingQueueQuerySchema, schedulingReorderSchema } from '@/lib/api/schemas/media';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/content/scheduling-queue
 * List scheduled content items ordered by publish_date.
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'content:queue' });
  if (limited) return limitResp!;

  const { data: query, error: qErr } = validateQuery(
    request.nextUrl.searchParams,
    schedulingQueueQuerySchema
  );
  if (qErr) return qErr;

  const { page, limit } = query!;

  const dataQuery = supabase
    .from('content_items')
    .select('id, title, content_type, status, publish_date, slug, created_at, created_by')
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'scheduled')
    .not('publish_date', 'is', null)
    .order('publish_date', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  const countQuery = supabase
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'scheduled')
    .not('publish_date', 'is', null);

  const [{ data, error: dataErr }, { count, error: countErr }] = await Promise.all([
    dataQuery,
    countQuery,
  ]);

  if (dataErr) return dbError(dataErr, 'Failed to fetch scheduling queue');
  if (countErr) return dbError(countErr, 'Failed to count scheduled items');

  return success({ items: data, total: count, page, limit });
}

/**
 * PATCH /api/content/scheduling-queue
 * Bulk update publish dates (reorder the scheduling queue).
 */
export async function PATCH(request: NextRequest) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'content:queue:reorder' });
  if (limited) return limitResp!;

  const { data: body, error: bodyErr } = await validateBody(request, schedulingReorderSchema);
  if (bodyErr) return bodyErr;

  // Update each item's publish_date
  for (const item of body!.items) {
    const { error: updateErr } = await supabase
      .from('content_items')
      .update({ publish_date: item.publish_date })
      .eq('id', item.id)
      .eq('tenant_id', profile.tenant_id);

    if (updateErr) return dbError(updateErr, 'Failed to update scheduled item');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'reorder_scheduling_queue',
    resource_type: 'content_item',
    details: { items_count: body!.items.length },
  });

  return success({ updated: body!.items.length });
}
