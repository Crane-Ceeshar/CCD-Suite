import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { contentCreateSchema, contentListQuerySchema } from '@/lib/api/schemas/content';
import { rateLimit } from '@/lib/api/rate-limit';
import { checkContentPermission } from '@/lib/api/permissions';

/**
 * GET /api/content
 * List content items with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'content:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    contentListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, type: contentType, category_id: categoryId, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('content_items')
    .select('*, category:content_categories(id, name, slug, color)', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (contentType) {
    dbQuery = dbQuery.eq('content_type', contentType);
  }
  if (categoryId) {
    dbQuery = dbQuery.eq('category_id', categoryId);
  }

  if (search) {
    // Try full-text search first (requires migration 00038_fulltext_search).
    // If it fails (e.g. search_vector column missing), fall back to ilike.
    const ftsQuery = dbQuery.textSearch('search_vector', search, { type: 'websearch' });
    const { data: ftsData, error: ftsError, count: ftsCount } = await ftsQuery;

    if (!ftsError) {
      return NextResponse.json({ success: true, data: ftsData, count: ftsCount });
    }

    // Fallback: ilike search on title and excerpt
    dbQuery = dbQuery.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch content');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/content
 * Create a new content item.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'content:create' });
  if (limited) return limitResp!;

  // Check permission: writer+ can create
  const perm = await checkContentPermission(supabase, user.id, profile.tenant_id, 'writer');
  if (!perm.allowed) return perm.error!;

  const { data: body, error: bodyError } = await validateBody(request, contentCreateSchema);
  if (bodyError) return bodyError;

  // Auto-generate slug from title if not provided
  const slug =
    body.slug ||
    body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const { data, error: insertError } = await supabase
    .from('content_items')
    .insert({
      tenant_id: profile.tenant_id,
      category_id: body.category_id ?? null,
      title: body.title,
      slug,
      content_type: body.content_type,
      body: body.body ?? null,
      excerpt: body.excerpt ?? null,
      status: body.status,
      publish_date: body.publish_date ?? null,
      platforms: body.platforms,
      tags: body.tags,
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
      featured_image_url: body.featured_image_url ?? null,
      metadata: body.metadata,
      author_id: user.id,
      created_by: user.id,
    })
    .select('*, category:content_categories(id, name, slug, color)')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create content');
  }

  return success(data, 201);
}
