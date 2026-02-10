import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['publish', 'archive', 'delete'], {
    required_error: 'Action is required',
    invalid_type_error: 'Must be publish, archive, or delete',
  }),
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

/**
 * POST /api/content/bulk
 * Perform bulk operations on content items.
 */
export async function POST(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data: body, error: bodyError } = await validateBody(request, bulkActionSchema);
  if (bodyError) return bodyError;

  const { action, ids } = body;

  switch (action) {
    case 'publish': {
      const { error: updateError, count } = await supabase
        .from('content_items')
        .update({ status: 'published', publish_date: new Date().toISOString() })
        .in('id', ids);

      if (updateError) {
        return dbError(updateError, 'Failed to publish items');
      }

      return success({ affected: count ?? ids.length });
    }

    case 'archive': {
      const { error: updateError, count } = await supabase
        .from('content_items')
        .update({ status: 'archived' })
        .in('id', ids);

      if (updateError) {
        return dbError(updateError, 'Failed to archive items');
      }

      return success({ affected: count ?? ids.length });
    }

    case 'delete': {
      // Delete related assets and approvals first
      await supabase.from('content_assets').delete().in('content_item_id', ids);
      await supabase.from('content_approvals').delete().in('content_item_id', ids);

      const { error: deleteError, count } = await supabase
        .from('content_items')
        .delete()
        .in('id', ids);

      if (deleteError) {
        return dbError(deleteError, 'Failed to delete items');
      }

      return success({ affected: count ?? ids.length });
    }

    default:
      return errorResponse('Unknown action', 400);
  }
}
