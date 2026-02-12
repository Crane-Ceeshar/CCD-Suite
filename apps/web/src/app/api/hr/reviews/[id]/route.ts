import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, notFound } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updatePerformanceReviewSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/reviews/[id]
 * Get a single performance review with employee and reviewer joins.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:reviews:get' });
  if (limited) return limitResp!;

  const { data: review, error: queryError } = await supabase
    .from('performance_reviews')
    .select('*, employee:employees!employee_id(id, first_name, last_name), reviewer:employees!reviewer_id(id, first_name, last_name)')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Review not found');
  }

  return success(review);
}

/**
 * PATCH /api/hr/reviews/[id]
 * Update a performance review.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:reviews:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updatePerformanceReviewSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.reviewer_id !== undefined) updateFields.reviewer_id = body.reviewer_id;
  if (body.review_period !== undefined) updateFields.review_period = body.review_period;
  if (body.review_date !== undefined) updateFields.review_date = body.review_date;
  if (body.rating !== undefined) updateFields.rating = body.rating;
  if (body.strengths !== undefined) updateFields.strengths = body.strengths;
  if (body.areas_for_improvement !== undefined) updateFields.areas_for_improvement = body.areas_for_improvement;
  if (body.goals !== undefined) updateFields.goals = body.goals;
  if (body.overall_comments !== undefined) updateFields.overall_comments = body.overall_comments;
  if (body.status !== undefined) {
    updateFields.status = body.status;
    if (body.status === 'acknowledged') {
      updateFields.acknowledged_at = new Date().toISOString();
    }
  }

  const { data: review, error: updateError } = await supabase
    .from('performance_reviews')
    .update(updateFields)
    .eq('id', id)
    .select('*, employee:employees!employee_id(id, first_name, last_name), reviewer:employees!reviewer_id(id, first_name, last_name)')
    .single();

  if (updateError) {
    return dbError(updateError, 'Review not found');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'review.updated',
    resource_type: 'performance_review',
    resource_id: id,
    details: body,
  });

  return success(review);
}
