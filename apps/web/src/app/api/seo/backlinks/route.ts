import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id') ?? '';
  const status = searchParams.get('status') ?? '';
  const search = searchParams.get('search') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('seo_backlinks')
    .select('*', { count: 'exact' })
    .order('discovered_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (search) {
    query = query.or(`source_url.ilike.%${search}%,anchor_text.ilike.%${search}%`);
  }

  const { data, error: queryError, count } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  const { data, error: insertError } = await supabase
    .from('seo_backlinks')
    .insert({
      tenant_id: profile.tenant_id,
      project_id: body.project_id,
      source_url: body.source_url,
      target_url: body.target_url,
      anchor_text: body.anchor_text ?? null,
      domain_authority: body.domain_authority ?? null,
      status: body.status ?? 'active',
      discovered_at: body.discovered_at ?? new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
