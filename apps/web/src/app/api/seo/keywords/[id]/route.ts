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
    .from('seo_keywords')
    .select('*')
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

  const { data, error: updateError } = await supabase
    .from('seo_keywords')
    .update({
      ...(body.keyword !== undefined && { keyword: body.keyword }),
      ...(body.search_volume !== undefined && { search_volume: body.search_volume }),
      ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
      ...(body.current_rank !== undefined && { current_rank: body.current_rank }),
      ...(body.previous_rank !== undefined && { previous_rank: body.previous_rank }),
      ...(body.target_rank !== undefined && { target_rank: body.target_rank }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.tags !== undefined && { tags: body.tags }),
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
    .from('seo_keywords')
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
