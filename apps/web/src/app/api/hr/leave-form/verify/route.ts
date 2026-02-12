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

  const { data: tokenData, error: tokenError } = await supabase
    .from('hr_form_tokens')
    .select('id, tenant_id, employee_id, expires_at, used_at')
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

  // Fetch employee
  const { data: employee } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email')
    .eq('id', tokenData.employee_id)
    .single();

  // Fetch leave balances
  const currentYear = new Date().getFullYear();
  const { data: balances } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', tokenData.employee_id)
    .eq('year', currentYear);

  return NextResponse.json({
    success: true,
    data: {
      employee: employee ? {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
      } : null,
      balances: balances ?? [],
    },
  });
}
