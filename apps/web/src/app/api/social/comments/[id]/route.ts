import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import * as ayrshare from '@/lib/services/ayrshare';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  // Update the DB first
  const { data, error: updateError } = await supabase
    .from('social_comments')
    .update({
      replied: true,
      reply_content: body.reply_content,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  // If Ayrshare is configured, try to reply on the actual platform
  if (ayrshare.isConfigured() && data?.post_id && body.reply_content) {
    try {
      // Get the post to find the Ayrshare ID
      const { data: post } = await supabase
        .from('social_posts')
        .select('external_id')
        .eq('id', data.post_id)
        .single();

      if (post?.external_id) {
        // Get Ayrshare profile key
        const { data: provider } = await supabase
          .from('social_provider_profiles')
          .select('profile_key')
          .eq('tenant_id', profile.tenant_id)
          .eq('provider', 'ayrshare')
          .eq('status', 'active')
          .single();

        if (provider?.profile_key) {
          await ayrshare.replyToComment({
            id: post.external_id,
            comment: body.reply_content,
            platforms: [data.platform],
            profileKey: provider.profile_key,
          });
        }
      }
    } catch {
      // Reply saved in DB even if Ayrshare reply fails
      console.error('Failed to post reply via Ayrshare');
    }
  }

  return NextResponse.json({ success: true, data });
}
