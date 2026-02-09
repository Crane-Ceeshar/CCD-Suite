import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id') ?? '';
  const status = searchParams.get('status') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('seo_audits')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (status) {
    query = query.eq('status', status);
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

  // Create the audit in "running" state
  const { data, error: insertError } = await supabase
    .from('seo_audits')
    .insert({
      tenant_id: profile.tenant_id,
      project_id: body.project_id,
      status: 'running',
      started_at: new Date().toISOString(),
      score: null,
      issues_count: 0,
      pages_crawled: 0,
      results: {},
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  // Simulate audit completion with random results
  const simulatedScore = Math.floor(Math.random() * 36) + 60; // 60-95
  const simulatedIssues = Math.floor(Math.random() * 26) + 5; // 5-30
  const simulatedPages = Math.floor(Math.random() * 451) + 50; // 50-500

  const { data: completedAudit, error: updateError } = await supabase
    .from('seo_audits')
    .update({
      status: 'completed',
      score: simulatedScore,
      issues_count: simulatedIssues,
      pages_crawled: simulatedPages,
      completed_at: new Date().toISOString(),
      results: {
        score: simulatedScore,
        issues_count: simulatedIssues,
        pages_crawled: simulatedPages,
      },
    })
    .eq('id', data.id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: completedAudit }, { status: 201 });
}
