import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? '';
  const dealId = searchParams.get('deal_id') ?? '';
  const contactId = searchParams.get('contact_id') ?? '';
  const companyId = searchParams.get('company_id') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('activities')
    .select(
      '*, deal:deals(id, title), contact:contacts(id, first_name, last_name), company:companies(id, name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('type', type);
  if (dealId) query = query.eq('deal_id', dealId);
  if (contactId) query = query.eq('contact_id', contactId);
  if (companyId) query = query.eq('company_id', companyId);

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

  const { data, error: insertError } = await supabase
    .from('activities')
    .insert({
      tenant_id: profile.tenant_id,
      type: body.type,
      title: body.title,
      description: body.description ?? null,
      deal_id: body.deal_id ?? null,
      contact_id: body.contact_id ?? null,
      company_id: body.company_id ?? null,
      scheduled_at: body.scheduled_at ?? null,
      created_by: user.id,
    })
    .select(
      '*, deal:deals(id, title), contact:contacts(id, first_name, last_name), company:companies(id, name)'
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
