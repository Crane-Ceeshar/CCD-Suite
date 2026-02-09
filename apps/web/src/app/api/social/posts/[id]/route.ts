import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('social_posts')
    .select('*, engagement:social_engagement(*)')
    .eq('id', id)
    .single();

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const updateFields: Record<string, unknown> = {
    ...(body.content !== undefined && { content: body.content }),
    ...(body.media_urls !== undefined && { media_urls: body.media_urls }),
    ...(body.platforms !== undefined && { platforms: body.platforms }),
    ...(body.scheduled_at !== undefined && { scheduled_at: body.scheduled_at }),
    ...(body.status !== undefined && { status: body.status }),
    ...(body.account_ids !== undefined && { account_ids: body.account_ids }),
    ...(body.campaign_id !== undefined && { campaign_id: body.campaign_id }),
    ...(body.metadata !== undefined && { metadata: body.metadata }),
  };

  // Handle publish action
  if (body.action === 'publish') {
    updateFields.status = 'published';
    updateFields.published_at = new Date().toISOString();
  }

  const { data, error: updateError } = await supabase
    .from('social_posts')
    .update(updateFields)
    .eq('id', id)
    .select('*, engagement:social_engagement(*)')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { error: deleteError } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
