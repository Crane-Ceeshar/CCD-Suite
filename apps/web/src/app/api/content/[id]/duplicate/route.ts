import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * POST /api/content/:id/duplicate
 * Clone a content item as a new draft with "(Copy)" suffix.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Read the original content item
  const { data: original, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Content item');
  }

  // Generate new slug
  const baseSlug = original.slug || original.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const newSlug = `${baseSlug}-copy-${Date.now()}`;

  // Insert new record as draft with "(Copy)" suffix
  const { data: duplicate, error: insertError } = await supabase
    .from('content_items')
    .insert({
      tenant_id: profile.tenant_id,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      content_type: original.content_type,
      body: original.body,
      excerpt: original.excerpt,
      status: 'draft',
      publish_date: null,
      platforms: original.platforms ?? [],
      tags: original.tags ?? [],
      seo_title: original.seo_title,
      seo_description: original.seo_description,
      featured_image_url: original.featured_image_url,
      metadata: original.metadata ?? {},
      category_id: original.category_id,
      author_id: user.id,
      created_by: user.id,
    })
    .select('*, category:content_categories(id, name, slug, color)')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to duplicate content');
  }

  return success(duplicate, 201);
}
