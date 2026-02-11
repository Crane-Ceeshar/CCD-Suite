import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { taskReorderSchema } from '@/lib/api/schemas/projects';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * POST /api/projects/:id/tasks/reorder
 * Bulk reorder tasks — supports cross-column drag.
 * Body: { items: [{ id, status?, position }] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id: projectId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'tasks:reorder' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, taskReorderSchema);
  if (bodyError) return bodyError;

  // Update each task's position and optionally status
  const updates = body.items.map((item) => {
    const fields: Record<string, unknown> = { position: item.position };
    if (item.status) fields.status = item.status;

    return supabase
      .from('tasks')
      .update(fields)
      .eq('id', item.id)
      .eq('project_id', projectId);
  });

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);

  if (failed?.error) {
    return dbError(failed.error, 'Failed to reorder tasks');
  }

  return success({ reordered: body.items.length });
}
