import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, error } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { commentCreateSchema, commentListQuerySchema } from '@/lib/api/schemas/content';
import { createNotification } from '@/lib/api/activity';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/content/:id/comments
 * List threaded comments for a content item.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { data: query, error: queryError } = validateQuery(
    request.nextUrl.searchParams,
    commentListQuerySchema
  );
  if (queryError) return queryError;

  const { page, limit } = query!;
  const offset = (page - 1) * limit;

  // Fetch top-level comments with author info
  const { data, error: fetchError, count } = await supabase
    .from('content_comments')
    .select(
      '*, author:profiles!content_comments_author_id_fkey(id, display_name, avatar_url)',
      { count: 'exact' }
    )
    .eq('content_item_id', id)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (fetchError) {
    // If the join fails (missing FK name), try without the explicit FK hint
    const { data: fallbackData, error: fallbackError, count: fallbackCount } = await supabase
      .from('content_comments')
      .select('*', { count: 'exact' })
      .eq('content_item_id', id)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (fallbackError) return dbError(fallbackError, 'Comments');

    // Fetch replies for each top-level comment
    const topIds = (fallbackData ?? []).map((c: { id: string }) => c.id);
    let replies: Record<string, unknown>[] = [];
    if (topIds.length > 0) {
      const { data: replyData } = await supabase
        .from('content_comments')
        .select('*')
        .in('parent_id', topIds)
        .order('created_at', { ascending: true });
      replies = replyData ?? [];
    }

    // Group replies by parent_id
    const replyMap: Record<string, Record<string, unknown>[]> = {};
    replies.forEach((r: Record<string, unknown>) => {
      const pid = r.parent_id as string;
      if (!replyMap[pid]) replyMap[pid] = [];
      replyMap[pid].push(r);
    });

    const threaded = (fallbackData ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      replies: replyMap[c.id as string] ?? [],
    }));

    return success({ comments: threaded, count: fallbackCount });
  }

  // Fetch replies for all top-level comments
  const topIds = (data ?? []).map((c: { id: string }) => c.id);
  let replies: Record<string, unknown>[] = [];
  if (topIds.length > 0) {
    const { data: replyData } = await supabase
      .from('content_comments')
      .select('*, author:profiles!content_comments_author_id_fkey(id, display_name, avatar_url)')
      .in('parent_id', topIds)
      .order('created_at', { ascending: true });

    if (replyData) {
      replies = replyData;
    } else {
      const { data: replyFallback } = await supabase
        .from('content_comments')
        .select('*')
        .in('parent_id', topIds)
        .order('created_at', { ascending: true });
      replies = replyFallback ?? [];
    }
  }

  // Group replies by parent_id
  const replyMap: Record<string, Record<string, unknown>[]> = {};
  replies.forEach((r: Record<string, unknown>) => {
    const pid = r.parent_id as string;
    if (!replyMap[pid]) replyMap[pid] = [];
    replyMap[pid].push(r);
  });

  const threaded = (data ?? []).map((c: Record<string, unknown>) => ({
    ...c,
    replies: replyMap[c.id as string] ?? [],
  }));

  return success({ comments: threaded, count });
}

/**
 * POST /api/content/:id/comments
 * Create a new comment on a content item.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'content:comment' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, commentCreateSchema);
  if (bodyError) return bodyError;

  // Verify content item exists
  const { data: item, error: itemError } = await supabase
    .from('content_items')
    .select('id, title, created_by, tenant_id')
    .eq('id', id)
    .single();

  if (itemError) return dbError(itemError, 'Content item');

  const { data: comment, error: insertError } = await supabase
    .from('content_comments')
    .insert({
      tenant_id: item.tenant_id,
      content_item_id: id,
      parent_id: body.parent_id ?? null,
      author_id: user.id,
      body: body.body,
      position_anchor: body.position_anchor ?? null,
      mentions: body.mentions,
    })
    .select('*')
    .single();

  if (insertError) return dbError(insertError, 'Comment');

  // Notify content author about new comment (unless they're the commenter)
  if (item.created_by && item.created_by !== user.id) {
    createNotification(supabase, profile.tenant_id, {
      user_id: item.created_by,
      type: 'info',
      title: `New comment on "${item.title}"`,
      message: body.body.slice(0, 200),
      link: `/content/editor?id=${id}`,
      module: 'content',
    });
  }

  // Notify mentioned users
  if (body.mentions.length > 0) {
    for (const mentionedId of body.mentions) {
      if (mentionedId !== user.id && mentionedId !== item.created_by) {
        createNotification(supabase, profile.tenant_id, {
          user_id: mentionedId,
          type: 'mention',
          title: `You were mentioned in a comment on "${item.title}"`,
          message: body.body.slice(0, 200),
          link: `/content/editor?id=${id}`,
          module: 'content',
        });
      }
    }
  }

  return success(comment, 201);
}
