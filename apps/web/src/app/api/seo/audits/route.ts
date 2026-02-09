import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { runSeoAudit } from '@/lib/seo/audit-engine';

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

  // 1. Fetch the project to get the domain
  const { data: project, error: projectError } = await supabase
    .from('seo_projects')
    .select('domain')
    .eq('id', body.project_id)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  // 2. Create the audit in "running" state
  const { data: audit, error: insertError } = await supabase
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

  try {
    // 3. Run the real audit engine (Google PSI + HTML crawl)
    const auditResult = await runSeoAudit(project.domain);

    // 4. Update the audit record with real results
    const { data: completedAudit, error: updateError } = await supabase
      .from('seo_audits')
      .update({
        status: 'completed',
        score: auditResult.score,
        issues_count: auditResult.issuesCount,
        pages_crawled: auditResult.pagesCrawled,
        completed_at: new Date().toISOString(),
        results: auditResult.results,
      })
      .eq('id', audit.id)
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { message: updateError.message } },
        { status: 500 }
      );
    }

    // 5. Auto-insert recommendations for each issue found
    if (auditResult.recommendations.length > 0) {
      const recInserts = auditResult.recommendations.map((rec) => ({
        tenant_id: profile.tenant_id,
        project_id: body.project_id,
        audit_id: audit.id,
        type: rec.type,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        status: 'open' as const,
      }));

      await supabase.from('seo_recommendations').insert(recInserts);
    }

    return NextResponse.json({ success: true, data: completedAudit }, { status: 201 });
  } catch (err) {
    // 6. Mark audit as failed on any error
    await supabase
      .from('seo_audits')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        results: { error: err instanceof Error ? err.message : 'Audit engine failed' },
      })
      .eq('id', audit.id);

    return NextResponse.json(
      {
        success: false,
        error: { message: err instanceof Error ? err.message : 'Audit failed' },
      },
      { status: 500 }
    );
  }
}
