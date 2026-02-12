import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';
import { z } from 'zod';

const createHolidaySchema = z.object({
  name: z.string().min(1, 'Holiday name is required').max(200),
  date: z.string().min(1, 'Date is required'),
  region: z.string().max(100).nullable().optional(),
  is_recurring: z.boolean().default(false),
});

/**
 * GET /api/hr/holidays
 * List public holidays, optionally filtered by year.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:holidays:list' });
  if (limited) return limitResp!;

  const year = request.nextUrl.searchParams.get('year');

  let dbQuery = supabase
    .from('public_holidays')
    .select('*')
    .order('date', { ascending: true });

  if (year) {
    const yearNum = parseInt(year, 10);
    dbQuery = dbQuery
      .gte('date', `${yearNum}-01-01`)
      .lte('date', `${yearNum}-12-31`);
  }

  const { data, error: queryError } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch holidays');
  }

  return NextResponse.json({ success: true, data });
}

/**
 * POST /api/hr/holidays
 * Create a new public holiday.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:holidays:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createHolidaySchema);
  if (bodyError) return bodyError;

  const { data: holiday, error: insertError } = await supabase
    .from('public_holidays')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      date: body.date,
      region: body.region ?? null,
      is_recurring: body.is_recurring,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create holiday');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'holiday.created',
    resource_type: 'public_holiday',
    resource_id: holiday.id,
    details: { name: body.name, date: body.date },
  });

  return success(holiday, 201);
}
