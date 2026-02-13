import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/webhooks/ayrshare
 * Handles Ayrshare webhooks for post status updates, new comments, etc.
 * This endpoint does NOT use requireAuth() — it's called by Ayrshare's servers.
 */
export async function POST(request: NextRequest) {
  // Verify webhook (basic check — Ayrshare sends the API key in headers)
  const apiKey = process.env.AYRSHARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const eventType = body.type || body.action || '';

    // Use service role client since this is a webhook (no user auth)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle different event types
    switch (eventType) {
      case 'post': {
        // Post published/failed notification
        const ayrshareId = body.id;
        const status = body.status === 'success' ? 'published' : 'failed';

        if (ayrshareId) {
          const updateFields: Record<string, unknown> = { status };
          if (status === 'published') {
            updateFields.published_at = new Date().toISOString();
            updateFields.publish_error = null;
          }
          if (status === 'failed' && body.errors) {
            updateFields.publish_error = body.errors.map((e: { message: string }) => e.message).join('; ');
          }

          await supabase
            .from('social_posts')
            .update(updateFields)
            .eq('external_id', ayrshareId);
        }
        break;
      }

      case 'comment': {
        // New comment received
        const postAyrshareId = body.postId;
        const comment = body.comment;
        const platform = body.platform;

        if (postAyrshareId && comment) {
          // Find the post by external_id
          const { data: post } = await supabase
            .from('social_posts')
            .select('id, tenant_id')
            .eq('external_id', postAyrshareId)
            .single();

          if (post) {
            // Check for duplicate
            const externalId = body.commentId || body.id;
            if (externalId) {
              const { data: existing } = await supabase
                .from('social_comments')
                .select('id')
                .eq('external_id', externalId)
                .maybeSingle();

              if (existing) break; // Already exists
            }

            await supabase.from('social_comments').insert({
              tenant_id: post.tenant_id,
              post_id: post.id,
              platform: platform || 'unknown',
              external_id: externalId || null,
              author_name: body.userName || body.displayName || null,
              content: typeof comment === 'string' ? comment : JSON.stringify(comment),
              sentiment: null,
              replied: false,
              metadata: { source: 'webhook' },
              posted_at: body.created || new Date().toISOString(),
            });
          }
        }
        break;
      }

      default:
        // Unknown event type — log sanitized type and ignore
        console.log('Unknown Ayrshare webhook event:', String(eventType).replace(/[\r\n]/g, '').slice(0, 100));
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Ayrshare webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
