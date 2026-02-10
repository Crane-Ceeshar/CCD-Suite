import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { mediaListQuerySchema } from '@/lib/api/schemas/media';
import { assetCreateSchema } from '@/lib/api/schemas/content';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/media
 * List media library assets (content_assets WHERE is_library = true).
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'media:list' });
  if (limited) return limitResp!;

  const { data: query, error: qErr } = validateQuery(
    request.nextUrl.searchParams,
    mediaListQuerySchema
  );
  if (qErr) return qErr;

  const { page, limit, search, tags } = query!;

  // Build the data query
  let dataQuery = supabase
    .from('content_assets')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_library', true);

  // Build the count query
  let countQuery = supabase
    .from('content_assets')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)
    .eq('is_library', true);

  if (search) {
    dataQuery = dataQuery.ilike('file_name', `%${search}%`);
    countQuery = countQuery.ilike('file_name', `%${search}%`);
  }

  if (tags && tags.length > 0) {
    dataQuery = dataQuery.overlaps('tags', tags);
    countQuery = countQuery.overlaps('tags', tags);
  }

  dataQuery = dataQuery
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  const [{ data, error: dataErr }, { count, error: countErr }] = await Promise.all([
    dataQuery,
    countQuery,
  ]);

  if (dataErr) return dbError(dataErr, 'Failed to fetch media assets');
  if (countErr) return dbError(countErr, 'Failed to count media assets');

  return success({ items: data, total: count, page, limit });
}

/**
 * POST /api/media
 * Create a new media library asset.
 */
export async function POST(request: NextRequest) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'media:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyErr } = await validateBody(request, assetCreateSchema);
  if (bodyErr) return bodyErr;

  const { data, error: insertErr } = await supabase
    .from('content_assets')
    .insert({
      ...body,
      is_library: true,
      tenant_id: profile.tenant_id,
      uploaded_by: user.id,
    })
    .select('*')
    .single();

  if (insertErr) return dbError(insertErr, 'Failed to create media asset');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'create_media_asset',
    resource_type: 'content_asset',
    resource_id: data.id,
    details: { file_name: data.file_name },
  });

  return success(data, 201);
}
