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

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.sku !== undefined) updateFields.sku = body.sku;
  if (body.price !== undefined) updateFields.price = body.price;
  if (body.currency !== undefined) updateFields.currency = body.currency;
  if (body.category !== undefined) updateFields.category = body.category;
  if (body.is_active !== undefined) updateFields.is_active = body.is_active;

  const { data, error: updateError } = await supabase
    .from('products')
    .update(updateFields)
    .eq('id', id)
    .select()
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

  const { error: deleteError } = await supabase.from('products').delete().eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
