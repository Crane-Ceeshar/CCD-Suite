import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createMessageSchema } from '@/lib/api/schemas/portal';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/portal/projects/:id/messages
 * List messages for a portal project (paginated, newest first).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0', 10);

  const { data, error: queryError } = await supabase
    .from('portal_messages')
    .select('*')
    .eq('portal_project_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (queryError) {
    return dbError(queryError, 'Failed to fetch messages');
  }

  // Enrich messages with sender profile data
  if (data && data.length > 0) {
    const senderIds = [...new Set(
      data
        .map((m: { sender_id: string | null }) => m.sender_id)
        .filter((id: string | null): id is string => id !== null)
    )];

    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', senderIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: { id: string; full_name: string; email: string; avatar_url: string | null }) => [p.id, p])
      );

      data.forEach((msg: { sender_id: string | null; sender?: { id: string; full_name: string; email: string; avatar_url: string | null } | null }) => {
        msg.sender = msg.sender_id ? profileMap.get(msg.sender_id) ?? null : null;
      });
    }
  }

  return success(data);
}

/**
 * POST /api/portal/projects/:id/messages
 * Create a message in a portal project.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'portal:messages:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createMessageSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('portal_messages')
    .insert({
      tenant_id: profile.tenant_id,
      portal_project_id: id,
      sender_id: user.id,
      content: body.content.trim(),
      attachments: body.attachments,
      is_internal: body.is_internal,
    })
    .select('*')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to send message');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_message.created',
    resource_type: 'portal_message',
    resource_id: data.id,
    details: { portal_project_id: id, is_internal: body.is_internal },
  });

  return success(data, 201);
}
