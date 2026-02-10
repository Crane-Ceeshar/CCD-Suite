import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { templateCreateSchema } from '@/lib/api/schemas/content';

/**
 * GET /api/content/templates
 * List templates (system + tenant custom).
 */
export async function GET() {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data, error: queryError } = await supabase
    .from('content_templates')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name', { ascending: true });

  if (queryError) return dbError(queryError, 'Template');

  return success(data);
}

/**
 * POST /api/content/templates
 * Create a custom template.
 */
export async function POST(request: NextRequest) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { data: body, error: bodyError } = await validateBody(request, templateCreateSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('content_templates')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      content_type: body.content_type,
      body_template: body.body_template,
      metadata_template: body.metadata_template,
      is_system: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) return dbError(insertError, 'Template');

  return success(data, 201);
}
