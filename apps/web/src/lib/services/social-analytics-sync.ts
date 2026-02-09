import type { SupabaseClient } from '@supabase/supabase-js';
import * as ayrshare from './ayrshare';

/**
 * Sync analytics for a single published post from Ayrshare into social_engagement.
 */
export async function syncPostAnalytics(
  postId: string,
  supabase: SupabaseClient,
  tenantId: string
): Promise<{ synced: boolean; error?: string }> {
  // Fetch the post to get its Ayrshare ID
  const { data: post } = await supabase
    .from('social_posts')
    .select('id, external_id, platforms, metadata')
    .eq('id', postId)
    .single();

  if (!post?.external_id) {
    return { synced: false, error: 'Post has no external ID' };
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
    return { synced: false, error: 'No Ayrshare profile' };
  }

  try {
    const analytics = await ayrshare.getPostAnalytics(
      post.external_id,
      post.platforms ?? [],
      provider.profile_key
    );

    // Upsert engagement rows per platform
    for (const [platform, data] of Object.entries(analytics)) {
      // Skip non-platform keys
      if (!data || typeof data !== 'object' || !('analytics' in data)) continue;
      const metrics = data.analytics;
      if (!metrics) continue;

      const likes = Number(metrics.likeCount ?? metrics.favoriteCount ?? 0);
      const comments = Number(metrics.commentCount ?? metrics.replyCount ?? 0);
      const shares = Number(metrics.sharesCount ?? metrics.retweetCount ?? 0);
      const impressions = Number(metrics.impressions ?? metrics.views ?? metrics.viewsCount ?? 0);
      const reach = Number(metrics.reachCount ?? 0);
      const clicks = Number(metrics.clicks ?? 0);
      const totalEngagement = likes + comments + shares;
      const engagementRate = impressions > 0 ? Math.round((totalEngagement / impressions) * 10000) / 100 : 0;

      // Check if engagement row already exists for this post+platform
      const { data: existing } = await supabase
        .from('social_engagement')
        .select('id')
        .eq('post_id', postId)
        .eq('platform', platform)
        .maybeSingle();

      if (existing) {
        // Update existing
        await supabase.from('social_engagement').update({
          likes,
          comments,
          shares,
          impressions,
          reach,
          clicks,
          engagement_rate: engagementRate,
          recorded_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        // Insert new
        await supabase.from('social_engagement').insert({
          tenant_id: tenantId,
          post_id: postId,
          platform,
          likes,
          comments,
          shares,
          impressions,
          reach,
          clicks,
          engagement_rate: engagementRate,
          recorded_at: new Date().toISOString(),
        });
      }
    }

    return { synced: true };
  } catch (err) {
    return { synced: false, error: err instanceof Error ? err.message : 'Analytics sync failed' };
  }
}

/**
 * Sync analytics for ALL published posts that have an external_id.
 */
export async function syncAllAnalytics(
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

  let synced = 0;
  const errors: string[] = [];

  for (const post of posts) {
    const result = await syncPostAnalytics(post.id, supabase, tenantId);
    if (result.synced) {
      synced++;
    } else if (result.error) {
      errors.push(`${post.id}: ${result.error}`);
    }
  }

  return { total: posts.length, synced, errors };
}
