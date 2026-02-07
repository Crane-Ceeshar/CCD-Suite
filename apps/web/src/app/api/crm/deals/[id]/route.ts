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
    .from('deals')
    .select(
      '*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)'
    )
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

  const updateFields: Record<string, unknown> = {};
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.value !== undefined) updateFields.value = body.value;
  if (body.currency !== undefined) updateFields.currency = body.currency;
  if (body.stage_id !== undefined) updateFields.stage_id = body.stage_id;
  if (body.pipeline_id !== undefined) updateFields.pipeline_id = body.pipeline_id;
  if (body.company_id !== undefined) updateFields.company_id = body.company_id;
  if (body.contact_id !== undefined) updateFields.contact_id = body.contact_id;
  if (body.status !== undefined) {
    updateFields.status = body.status;
    if (body.status === 'won' || body.status === 'lost') {
      updateFields.actual_close_date = new Date().toISOString();
    }
  }
  if (body.expected_close_date !== undefined) updateFields.expected_close_date = body.expected_close_date;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  if (body.position !== undefined) updateFields.position = body.position;
  if (body.assigned_to !== undefined) updateFields.assigned_to = body.assigned_to;

  const { data, error: updateError } = await supabase
    .from('deals')
    .update(updateFields)
    .eq('id', id)
    .select(
      '*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)'
    )
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

  const { error: deleteError } = await supabase.from('deals').delete().eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
