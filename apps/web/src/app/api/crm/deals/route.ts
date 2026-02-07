import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const stageId = searchParams.get('stage_id') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('deals')
    .select(
      '*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const companyId = searchParams.get('company_id') ?? '';
  const contactId = searchParams.get('contact_id') ?? '';

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (stageId) {
    query = query.eq('stage_id', stageId);
  }
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  if (contactId) {
    query = query.eq('contact_id', contactId);
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
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();

  // Determine position: last in the stage
  const { count } = await supabase
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('stage_id', body.stage_id);

  const { data, error: insertError } = await supabase
    .from('deals')
    .insert({
      tenant_id: profile.tenant_id,
      pipeline_id: body.pipeline_id,
      stage_id: body.stage_id,
      title: body.title,
      value: body.value ?? 0,
      currency: body.currency ?? 'USD',
      company_id: body.company_id ?? null,
      contact_id: body.contact_id ?? null,
      expected_close_date: body.expected_close_date ?? null,
      notes: body.notes ?? null,
      assigned_to: body.assigned_to ?? null,
      position: (count ?? 0),
      status: 'open',
      created_by: user.id,
    })
    .select(
      '*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)'
    )
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
