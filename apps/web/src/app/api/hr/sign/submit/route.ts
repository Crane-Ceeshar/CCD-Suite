import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/service-client';

export async function POST(request: NextRequest) {
  let body: { token?: string; signature_data?: string; signature_method?: string; typed_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { token, signature_data, signature_method, typed_name } = body;

  if (!token || !signature_data || !signature_method) {
    return NextResponse.json(
      { success: false, error: { message: 'Token, signature_data, and signature_method are required' } },
      { status: 400 }
    );
  }

  if (!['draw', 'type'].includes(signature_method)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid signature method' } },
      { status: 400 }
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const supabase = createServiceClient();

  // Verify token
  const { data: tokenData, error: tokenError } = await supabase
    .from('hr_form_tokens')
    .select('id, tenant_id, employee_id, metadata')
    .eq('token_hash', tokenHash)
    .eq('token_type', 'contract_signing')
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (tokenError || !tokenData) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired signing link' } },
      { status: 401 }
    );
  }

  const contractId = (tokenData.metadata as any)?.contract_id;

  // Get client IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  // Save signature
  const { error: sigError } = await supabase
    .from('document_signatures')
    .insert({
      tenant_id: tokenData.tenant_id,
      contract_id: contractId,
      signer_employee_id: tokenData.employee_id,
      signature_data,
      signature_method,
      typed_name: typed_name ?? null,
      ip_address: ip,
    });

  if (sigError) {
    return NextResponse.json(
      { success: false, error: { message: sigError.message } },
      { status: 500 }
    );
  }

  // Update contract status
  await supabase
    .from('contracts')
    .update({ status: 'signed', signed_at: new Date().toISOString() })
    .eq('id', contractId);

  // Mark token as used
  await supabase
    .from('hr_form_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenData.id);

  return NextResponse.json({ success: true, data: { signed: true, contract_id: contractId } });
}
