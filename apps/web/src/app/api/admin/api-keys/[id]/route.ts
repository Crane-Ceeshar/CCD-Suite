import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  // Soft-delete: set is_active to false
  const { error: updateError } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id);

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'api_key.deleted',
    resource_type: 'api_key',
    resource_id: id,
    details: {},
  });

  return NextResponse.json({ success: true });
}
