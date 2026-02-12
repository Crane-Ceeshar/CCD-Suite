import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { categoryCreateSchema } from '@/lib/api/schemas/content';
import { sanitizeObject } from '@/lib/api/sanitize';

/**
 * GET /api/content/categories
 * List content categories for the current tenant.
 */
export async function GET() {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data, error: queryError } = await supabase
    .from('content_categories')
    .select('*')
    .order('name', { ascending: true });

  if (queryError) return dbError(queryError, 'Category');

  return success(data);
}

/**
 * POST /api/content/categories
 * Create a new content category.
 */
export async function POST(request: NextRequest) {
  const { error: authError, supabase, profile } = await requireAuth();
  if (authError) return authError;

  const { data: rawBody, error: bodyError } = await validateBody(request, categoryCreateSchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

  const slug =
    body.slug ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const { data, error: insertError } = await supabase
    .from('content_categories')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      slug,
      color: body.color ?? null,
    })
    .select()
    .single();

  if (insertError) return dbError(insertError, 'Category');

  return success(data, 201);
}
