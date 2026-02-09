import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id') ?? '';
  const auditId = searchParams.get('audit_id') ?? '';
  const type = searchParams.get('type') ?? '';
  const priority = searchParams.get('priority') ?? '';
  const status = searchParams.get('status') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('seo_recommendations')
    .select('*', { count: 'exact' })
    .order('priority')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (auditId) {
    query = query.eq('audit_id', auditId);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (priority) {
    query = query.eq('priority', priority);
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
