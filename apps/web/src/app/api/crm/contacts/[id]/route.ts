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
    .from('contacts')
    .select('*, company:companies(id, name)')
    .eq('id', id)
    .single();

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 404 }
    );
  }

  // Fetch linked portal projects for this contact
  const { data: portalProjects } = await supabase
    .from('portal_projects')
    .select('id, name, status, created_at')
    .eq('contact_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    success: true,
    data: { ...data, portal_projects: portalProjects ?? [] },
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
    .from('contacts')
    .update({
      ...(body.first_name !== undefined && { first_name: body.first_name }),
      ...(body.last_name !== undefined && { last_name: body.last_name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.job_title !== undefined && { job_title: body.job_title }),
      ...(body.company_id !== undefined && { company_id: body.company_id }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })
    .eq('id', id)
    .select('*, company:companies(id, name)')
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

  const { error: deleteError } = await supabase.from('contacts').delete().eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
