import type { SupabaseClient } from '@supabase/supabase-js';
import * as ayrshare from './ayrshare';
import type { AyrshareComment } from './ayrshare-types';

/**
 * Sync comments for a single published post from Ayrshare into social_comments.
 */
export async function syncComments(
  postId: string,
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ synced: number; error?: string }> {
  // Fetch the post to get its Ayrshare ID
  const { data: post } = await supabase
    .from('social_posts')
    .select('id, external_id, platforms')
    .eq('id', postId)
    .single();

  if (!post?.external_id) {
    return { synced: 0, error: 'Post has no external ID' };
  }

  // Get Ayrshare profile key
  const { data: provider } = await supabase
    .from('social_provider_profiles')
    .select('profile_key')
    .eq('tenant_id', tenantId)
    .eq('provider', 'ayrshare')
    .eq('status', 'active')
    .single();

  if (!provider?.profile_key) {
    return { synced: 0, error: 'No Ayrshare profile' };
  }

  try {
    const result = await ayrshare.getComments(post.external_id, provider.profile_key);
    let syncCount = 0;

    for (const [platform, data] of Object.entries(result)) {
      // Skip error entries or non-array data
      if (!Array.isArray(data)) continue;

      for (const comment of data as AyrshareComment[]) {
        const externalId = comment.commentId;
        if (!externalId) continue;

        // Check for duplicate by external_id
        const { data: existing } = await supabase
          .from('social_comments')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle();

        if (existing) continue; // Already synced

        await supabase.from('social_comments').insert({
          tenant_id: tenantId,
          post_id: postId,
          platform,
          external_id: externalId,
          author_name: comment.userName || comment.displayName || null,
          author_avatar: null,
          content: comment.comment || '',
          sentiment: null, // Could use AI to classify later
          replied: false,
          reply_content: null,
          metadata: {
            like_count: comment.likeCount ?? 0,
            ayrshare_post_id: post.external_id,
          },
          posted_at: comment.created || new Date().toISOString(),
        });
        syncCount++;
      }
    }

    return { synced: syncCount };
  } catch (err) {
    return { synced: 0, error: err instanceof Error ? err.message : 'Comments sync failed' };
  }
}

/**
 * Sync comments for ALL published posts that have an external_id.
 */
export async function syncAllComments(
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ total: number; synced: number; errors: string[] }> {
  const { data: posts } = await supabase
    .from('social_posts')
    .select('id')
    .eq('status', 'published')
    .not('external_id', 'is', null);

  if (!posts?.length) {
    return { total: 0, synced: 0, errors: [] };
  }

  let totalSynced = 0;
  const errors: string[] = [];

  for (const post of posts) {
    const result = await syncComments(post.id, supabase, tenantId);
    totalSynced += result.synced;
    if (result.error) {
      errors.push(`${post.id}: ${result.error}`);
    }
  }

  return { total: posts.length, synced: totalSynced, errors };
}
