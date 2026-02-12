import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createPerformanceReviewSchema, reviewListQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/reviews
 * List performance reviews with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:reviews:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    reviewListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { employee_id, status, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('performance_reviews')
    .select(
      '*, employee:employees!employee_id(id, first_name, last_name), reviewer:employees!reviewer_id(id, first_name, last_name)',
      { count: 'exact' }
    )
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (employee_id) {
    dbQuery = dbQuery.eq('employee_id', employee_id);
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch reviews');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/hr/reviews
 * Create a new performance review.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:reviews:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createPerformanceReviewSchema);
  if (bodyError) return bodyError;

  const { data: review, error: insertError } = await supabase
    .from('performance_reviews')
    .insert({
      tenant_id: profile.tenant_id,
      employee_id: body.employee_id,
      reviewer_id: body.reviewer_id ?? null,
      review_period: body.review_period,
      review_date: body.review_date ?? new Date().toISOString().split('T')[0],
      rating: body.rating ?? null,
      strengths: body.strengths ?? null,
      areas_for_improvement: body.areas_for_improvement ?? null,
      goals: body.goals ?? null,
      overall_comments: body.overall_comments ?? null,
      status: 'draft',
    })
    .select('*, employee:employees!employee_id(id, first_name, last_name), reviewer:employees!reviewer_id(id, first_name, last_name)')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create review');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'review.created',
    resource_type: 'performance_review',
    resource_id: review.id,
    details: { employee_id: body.employee_id, review_period: body.review_period },
  });

  return success(review, 201);
}
