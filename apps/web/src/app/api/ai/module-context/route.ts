import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get('module') ?? '';
  const contextType = searchParams.get('context_type') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);

  let query = supabase
    .from('ai_module_context')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (moduleName) {
    query = query.eq('module', moduleName);
  }
  if (contextType) {
    query = query.eq('context_type', contextType);
  }

  const { data, error: queryError } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  if (!body.module || !body.context_type) {
    return NextResponse.json(
      { success: false, error: { message: 'module and context_type are required' } },
      { status: 400 }
    );
  }

  const { data, error: insertError } = await supabase
    .from('ai_module_context')
    .insert({
      tenant_id: profile.tenant_id,
      module: body.module,
      context_type: body.context_type,
      context_data: body.context_data ?? {},
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
