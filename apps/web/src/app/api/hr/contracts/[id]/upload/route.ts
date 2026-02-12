import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 20, keyPrefix: 'hr:contracts:upload' });
  if (limited) return limitResp!;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: { message: 'No file provided' } },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const fileName = `${profile.tenant_id}/${id}/${Date.now()}_${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('hr-contracts')
    .upload(fileName, buffer, {
      contentType: file.type || 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { success: false, error: { message: uploadError.message } },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('hr-contracts')
    .getPublicUrl(fileName);

  // Update contract
  const { data: contract, error: updateError } = await supabase
    .from('contracts')
    .update({ file_url: urlData.publicUrl })
    .eq('id', id)
    .select()
    .single();

  if (updateError) return dbError(updateError, 'Contract not found');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'contract.file_uploaded',
    resource_type: 'contract',
    resource_id: id,
    details: { file_name: file.name },
  });

  return success(contract);
}
