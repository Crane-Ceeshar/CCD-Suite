import { NextRequest } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';
import { success, error, dbError } from '@/lib/api/responses';
import { rateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function GET(request: NextRequest) {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  const serviceClient = createAdminServiceClient();
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '50', 10)));
  const offset = (page - 1) * perPage;

  const severity = searchParams.get('severity');
  const eventType = searchParams.get('event_type');
  const resolved = searchParams.get('resolved');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  // Build count query
  let countQuery = serviceClient
    .from('security_events')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id);

  if (severity) countQuery = countQuery.eq('severity', severity);
  if (eventType) countQuery = countQuery.eq('event_type', eventType);
  if (resolved === 'true') countQuery = countQuery.eq('resolved', true);
  if (resolved === 'false') countQuery = countQuery.eq('resolved', false);
  if (from) countQuery = countQuery.gte('created_at', `${from}T00:00:00.000Z`);
  if (to) countQuery = countQuery.lte('created_at', `${to}T23:59:59.999Z`);

  const { count: total, error: countErr } = await countQuery;
  if (countErr) return dbError(countErr, 'Failed to count security events');

  // Build data query
  let dataQuery = serviceClient
    .from('security_events')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false });

  if (severity) dataQuery = dataQuery.eq('severity', severity);
  if (eventType) dataQuery = dataQuery.eq('event_type', eventType);
  if (resolved === 'true') dataQuery = dataQuery.eq('resolved', true);
  if (resolved === 'false') dataQuery = dataQuery.eq('resolved', false);
  if (from) dataQuery = dataQuery.gte('created_at', `${from}T00:00:00.000Z`);
  if (to) dataQuery = dataQuery.lte('created_at', `${to}T23:59:59.999Z`);

  const { data: events, error: queryErr } = await dataQuery
    .range(offset, offset + perPage - 1);

  if (queryErr) return dbError(queryErr, 'Failed to fetch security events');

  const totalCount = total ?? 0;

  return success({
    events: events ?? [],
    pagination: {
      page,
      per_page: perPage,
      total: totalCount,
      total_pages: Math.ceil(totalCount / perPage) || 1,
    },
  });
}
