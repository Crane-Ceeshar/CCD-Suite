import type { SupabaseClient } from '@supabase/supabase-js';
import * as ayrshare from './ayrshare';

export interface PublishResult {
  success: boolean;
  ayrshareId?: string;
  postIds?: Array<{ platform: string; id: string; postUrl?: string }>;
  error?: string;
  platformErrors?: Array<{ platform: string; message: string }>;
}

/**
 * Publish a social post through Ayrshare.
 * Updates the DB row with status and external IDs.
 */
export async function publishPost(
  postId: string,
  supabase: SupabaseClient,
  tenantId: string
): Promise<PublishResult> {
  // 1. Fetch the post
  const { data: post, error: postErr } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (postErr || !post) {
    return { success: false, error: 'Post not found' };
  }

  // 2. Get the Ayrshare profile key for this tenant
  const { data: provider } = await supabase
    .from('social_provider_profiles')
    .select('profile_key')
    .eq('tenant_id', tenantId)
    .eq('provider', 'ayrshare')
    .eq('status', 'active')
    .single();

  if (!provider?.profile_key) {
    // Mark as failed
    await supabase.from('social_posts').update({
      status: 'failed',
      publish_error: 'No connected Ayrshare profile. Please connect your social accounts first.',
    }).eq('id', postId);
    return { success: false, error: 'No connected Ayrshare profile' };
  }

  // 3. Set status to publishing
  await supabase
    .from('social_posts')
    .update({ status: 'publishing' })
    .eq('id', postId);

  try {
    // 4. Call Ayrshare
    const result = await ayrshare.publishPost({
      post: post.content || '',
      platforms: (post.platforms ?? []).map(ayrshare.mapPlatform),
      mediaUrls: post.media_urls?.length ? post.media_urls : undefined,
      profileKey: provider.profile_key,
    });

    if (result.status === 'error' || (result.errors && result.errors.length > 0 && !result.id)) {
      const errorMsg = result.errors?.map((e) => `${e.platform || 'unknown'}: ${e.message}`).join('; ') || 'Unknown error';
      await supabase.from('social_posts').update({
        status: 'failed',
        publish_error: errorMsg,
        metadata: {
          ...((post.metadata as Record<string, unknown>) ?? {}),
          ayrshare_errors: result.errors,
        },
      }).eq('id', postId);

      return {
        success: false,
        error: errorMsg,
        platformErrors: result.errors?.map((e) => ({
          platform: e.platform || 'unknown',
          message: e.message,
        })),
      };
    }

    // 5. Success — store external IDs
    const platformPostIds: Record<string, string> = {};
    const platformUrls: Record<string, string> = {};
    for (const pid of result.postIds ?? []) {
      platformPostIds[pid.platform] = pid.id;
      if (pid.postUrl) platformUrls[pid.platform] = pid.postUrl;
    }

    await supabase.from('social_posts').update({
      status: 'published',
      published_at: new Date().toISOString(),
      external_id: result.id ?? null,
      publish_error: null,
      metadata: {
        ...((post.metadata as Record<string, unknown>) ?? {}),
        ayrshare_id: result.id,
        platform_post_ids: platformPostIds,
        platform_post_urls: platformUrls,
      },
    }).eq('id', postId);

    return {
      success: true,
      ayrshareId: result.id,
      postIds: result.postIds?.map((p) => ({
        platform: p.platform,
        id: p.id,
        postUrl: p.postUrl,
      })),
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Publish failed';
    await supabase.from('social_posts').update({
      status: 'failed',
      publish_error: errMsg,
    }).eq('id', postId);
    return { success: false, error: errMsg };
  }
}

/**
 * Schedule a post via Ayrshare (Ayrshare handles the timing).
 */
export async function schedulePost(
  postId: string,
  scheduledAt: string,
  supabase: SupabaseClient,
  tenantId: string
): Promise<PublishResult> {
  // 1. Fetch the post
  const { data: post, error: postErr } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (postErr || !post) {
    return { success: false, error: 'Post not found' };
  }

  // 2. Get the Ayrshare profile key
  const { data: provider } = await supabase
    .from('social_provider_profiles')
    .select('profile_key')
    .eq('tenant_id', tenantId)
    .eq('provider', 'ayrshare')
    .eq('status', 'active')
    .single();

  if (!provider?.profile_key) {
    return { success: false, error: 'No connected Ayrshare profile' };
  }

  try {
    // 3. Schedule via Ayrshare
    const result = await ayrshare.publishPost({
      post: post.content || '',
      platforms: (post.platforms ?? []).map(ayrshare.mapPlatform),
      mediaUrls: post.media_urls?.length ? post.media_urls : undefined,
      scheduleDate: new Date(scheduledAt).toISOString(),
      profileKey: provider.profile_key,
    });

    if (result.status === 'error') {
      const errorMsg = result.errors?.map((e) => e.message).join('; ') || 'Scheduling failed';
      await supabase.from('social_posts').update({ publish_error: errorMsg }).eq('id', postId);
      return { success: false, error: errorMsg };
    }

    // Store the Ayrshare ID for the scheduled post
    await supabase.from('social_posts').update({
      external_id: result.id ?? null,
      metadata: {
        ...((post.metadata as Record<string, unknown>) ?? {}),
        ayrshare_id: result.id,
      },
    }).eq('id', postId);

    return { success: true, ayrshareId: result.id };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Schedule failed';
    return { success: false, error: errMsg };
  }
}
