import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/service-client';

export async function POST(request: NextRequest) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { token } = body;
  if (!token || typeof token !== 'string') {
    return NextResponse.json(
      { success: false, error: { message: 'Token is required' } },
      { status: 400 }
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const supabase = createServiceClient();

  // Look up token
  const { data: tokenData, error: tokenError } = await supabase
    .from('hr_form_tokens')
    .select('id, tenant_id, employee_id, token_type, expires_at, used_at, metadata')
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
  if (!contractId) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid token metadata' } },
      { status: 400 }
    );
  }

  // Fetch contract
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, title, type, content, file_url, status, employee_id')
    .eq('id', contractId)
    .single();

  if (contractError || !contract) {
    return NextResponse.json(
      { success: false, error: { message: 'Contract not found' } },
      { status: 404 }
    );
  }

  // Fetch employee name
  const { data: employee } = await supabase
    .from('employees')
    .select('id, first_name, last_name')
    .eq('id', contract.employee_id)
    .single();

  // Mark as viewed if first view
  if (contract.status === 'sent') {
    await supabase
      .from('contracts')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', contractId);
  }

  return NextResponse.json({
    success: true,
    data: {
      contract: {
        id: contract.id,
        title: contract.title,
        type: contract.type,
        content: contract.content,
        file_url: contract.file_url,
        status: contract.status,
      },
      employee: employee ? {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
      } : null,
    },
  });
}
