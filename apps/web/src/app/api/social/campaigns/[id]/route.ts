import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const [campaignRes, postsCountRes] = await Promise.all([
    supabase
      .from('social_campaigns')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('social_posts')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', id),
  ]);

  if (campaignRes.error) {
    return NextResponse.json(
      { success: false, error: { message: campaignRes.error.message } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...campaignRes.data,
      posts_count: postsCountRes.count ?? 0,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const { data, error: updateError } = await supabase
    .from('social_campaigns')
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.start_date !== undefined && { start_date: body.start_date }),
      ...(body.end_date !== undefined && { end_date: body.end_date }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.budget !== undefined && { budget: body.budget }),
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
    .from('social_campaigns')
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
