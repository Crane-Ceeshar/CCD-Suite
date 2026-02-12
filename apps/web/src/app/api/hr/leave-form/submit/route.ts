import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/service-client';

export async function POST(request: NextRequest) {
  let body: { token?: string; leave_type?: string; start_date?: string; end_date?: string; days_count?: number; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { token, leave_type, start_date, end_date, days_count, reason } = body;

  if (!token || !leave_type || !start_date || !end_date || !days_count) {
    return NextResponse.json(
      { success: false, error: { message: 'All fields are required: token, leave_type, start_date, end_date, days_count' } },
      { status: 400 }
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const supabase = createServiceClient();

  // Verify token
  const { data: tokenData, error: tokenError } = await supabase
    .from('hr_form_tokens')
    .select('id, tenant_id, employee_id')
    .eq('token_hash', tokenHash)
    .eq('token_type', 'leave_request')
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (tokenError || !tokenData) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired form link' } },
      { status: 401 }
    );
  }

  // Create leave request
  const { data: leaveRequest, error: insertError } = await supabase
    .from('leave_requests')
    .insert({
      tenant_id: tokenData.tenant_id,
      employee_id: tokenData.employee_id,
      type: leave_type,
      start_date,
      end_date,
      days_count,
      reason: reason ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  // Mark token as used
  await supabase
    .from('hr_form_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenData.id);

  return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
}
