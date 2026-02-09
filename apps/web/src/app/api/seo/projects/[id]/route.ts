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
    .from('seo_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 404 }
    );
  }

  // Fetch related counts and latest audit in parallel
  const [keywordsRes, latestAuditRes, backlinksRes] = await Promise.all([
    supabase
      .from('seo_keywords')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id),
    supabase
      .from('seo_audits')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('seo_backlinks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      keyword_count: keywordsRes.count ?? 0,
      latest_audit: latestAuditRes.data?.[0] ?? null,
      backlink_count: backlinksRes.count ?? 0,
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
    .from('seo_projects')
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.domain !== undefined && { domain: body.domain }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
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
    .from('seo_projects')
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
