import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const portalProjectId = searchParams.get('portal_project_id');

  if (!portalProjectId) {
    return NextResponse.json(
      { success: false, error: { message: 'portal_project_id is required' } },
      { status: 400 }
    );
  }

  const { data, error: queryError } = await supabase
    .from('portal_messages')
    .select('*, sender:profiles(id, full_name, avatar_url)')
    .eq('portal_project_id', portalProjectId)
    .order('created_at', { ascending: true });

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  const { portal_project_id, content, attachments, is_internal } = body as {
    portal_project_id: string;
    content: string;
    attachments?: unknown[];
    is_internal?: boolean;
  };

  if (!portal_project_id || !content?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: 'portal_project_id and content are required' } },
      { status: 400 }
    );
  }

  const { data, error: insertError } = await supabase
    .from('portal_messages')
    .insert({
      tenant_id: profile.tenant_id,
      portal_project_id,
      sender_id: user.id,
      content: content.trim(),
      attachments: attachments ?? [],
      is_internal: is_internal ?? false,
    })
    .select('*, sender:profiles(id, full_name, avatar_url)')
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
