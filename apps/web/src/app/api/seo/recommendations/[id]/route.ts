import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const { data, error: updateError } = await supabase
    .from('seo_recommendations')
    .update({
      ...(body.status !== undefined && { status: body.status }),
      ...(body.assigned_to !== undefined && { assigned_to: body.assigned_to }),
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
