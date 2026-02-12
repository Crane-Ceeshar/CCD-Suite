import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createLeavePolicySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/leave-policies
 * List all leave policies, ordered by employment_type and leave_type.
 */
export async function GET(_request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:leave-policies:list' });
  if (limited) return limitResp!;

  const { data, error: queryError } = await supabase
    .from('leave_policies')
    .select('*')
    .order('employment_type', { ascending: true })
    .order('leave_type', { ascending: true });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch leave policies');
  }

  return NextResponse.json({ success: true, data });
}

/**
 * POST /api/hr/leave-policies
 * Create a new leave policy.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:leave-policies:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createLeavePolicySchema);
  if (bodyError) return bodyError;

  const { data: policy, error: insertError } = await supabase
    .from('leave_policies')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      employment_type: body.employment_type,
      leave_type: body.leave_type,
      days_per_year: body.days_per_year,
      carry_over_max: body.carry_over_max,
      requires_approval: body.requires_approval,
      min_notice_days: body.min_notice_days,
      max_consecutive_days: body.max_consecutive_days ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create leave policy');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'leave_policy.created',
    resource_type: 'leave_policy',
    resource_id: policy.id,
    details: { name: body.name, leave_type: body.leave_type },
  });

  return success(policy, 201);
}
