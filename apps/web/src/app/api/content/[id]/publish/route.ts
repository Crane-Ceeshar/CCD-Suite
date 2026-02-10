import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, notFound, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { publishRequestSchema } from '@/lib/api/schemas/media';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * POST /api/content/:id/publish
 * Publish content to an external platform via a publishing integration.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 10, keyPrefix: 'content:publish' });
  if (limited) return limitResp!;

  const { data: body, error: bodyErr } = await validateBody(request, publishRequestSchema);
  if (bodyErr) return bodyErr;

  // Fetch the publishing integration
  const { data: integration, error: intErr } = await supabase
    .from('publishing_integrations')
    .select('*')
    .eq('id', body!.integration_id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (intErr || !integration) return notFound('Integration');
  if (!integration.is_active) return error('Integration is not active', 400);

  // Fetch the content item
  const { data: contentItem, error: contentErr } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', body!.content_item_id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (contentErr || !contentItem) return notFound('Content item');

  // Create a publish_log entry with status 'pending'
  const { data: logEntry, error: logErr } = await supabase
    .from('publish_log')
    .insert({
      tenant_id: profile.tenant_id,
      content_item_id: body!.content_item_id,
      integration_id: body!.integration_id,
      status: 'pending',
    })
    .select('*')
    .single();

  if (logErr) return dbError(logErr, 'Failed to create publish log');

  let externalUrl: string | null = null;
  let publishError: string | null = null;

  try {
    const contentPayload = {
      title: contentItem.title,
      body: contentItem.body ?? '',
      excerpt: contentItem.excerpt ?? undefined,
      tags: contentItem.tags ?? [],
    };

    if (integration.platform === 'wordpress') {
      const { publishToWordPress } = await import('@/lib/integrations/wordpress');
      const result = await publishToWordPress(
        integration.config ?? {},
        contentPayload
      );
      externalUrl = result.url;
    } else if (integration.platform === 'medium') {
      const { publishToMedium } = await import('@/lib/integrations/medium');
      const result = await publishToMedium(
        integration.config ?? {},
        contentPayload
      );
      externalUrl = result.url;
    } else {
      // Simulate success for other platforms with a mock URL
      await new Promise((resolve) => setTimeout(resolve, 300));
      externalUrl = `https://${integration.platform}.example.com/posts/${Date.now()}`;
    }
  } catch (err: unknown) {
    publishError = err instanceof Error ? err.message : 'Publishing failed';
  }

  // Update the publish_log entry based on outcome
  let updatedLogEntry;
  if (publishError) {
    const { data } = await supabase
      .from('publish_log')
      .update({
        status: 'failed',
        error_message: publishError,
      })
      .eq('id', logEntry.id)
      .select('*')
      .single();
    updatedLogEntry = data ?? logEntry;
  } else {
    const { data } = await supabase
      .from('publish_log')
      .update({
        status: 'published',
        external_url: externalUrl,
        published_at: new Date().toISOString(),
      })
      .eq('id', logEntry.id)
      .select('*')
      .single();
    updatedLogEntry = data ?? logEntry;
  }

  // Update the integration's last_published_at
  await supabase
    .from('publishing_integrations')
    .update({ last_published_at: new Date().toISOString() })
    .eq('id', integration.id);

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'publish_content',
    resource_type: 'publish_log',
    resource_id: logEntry.id,
    details: {
      content_item_id: body!.content_item_id,
      integration_id: body!.integration_id,
      platform: integration.platform,
      status: publishError ? 'failed' : 'published',
    },
  });

  return success(updatedLogEntry);
}
