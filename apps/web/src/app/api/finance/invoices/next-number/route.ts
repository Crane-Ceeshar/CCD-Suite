import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/finance/invoices/next-number
 * Generate the next auto-incremented invoice number.
 * Format: {SLUG_INITIAL}-INV-{YEAR}-{N}
 * Example: C-INV-2026-1, C-INV-2026-2, ...
 */
export async function GET() {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, {
    max: 60,
    keyPrefix: 'finance:invoices:next-number',
  });
  if (limited) return limitResp!;

  // 1. Get tenant slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('slug')
    .eq('id', profile.tenant_id)
    .single();

  if (tenantError || !tenant?.slug) {
    return NextResponse.json(
      { success: false, error: { message: 'Tenant not found' } },
      { status: 404 }
    );
  }

  const slugInitial = tenant.slug.charAt(0).toUpperCase();
  const currentYear = new Date().getFullYear();
  const prefix = `${slugInitial}-INV-${currentYear}-`;

  // 2. Find the highest existing invoice number with this prefix for the tenant
  const { data: invoices, error: queryError } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', `${prefix}%`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (queryError) {
    console.error('Failed to query invoices for next number:', queryError.message);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate invoice number' } },
      { status: 500 }
    );
  }

  // 3. Parse the trailing number from each matching invoice and find the max
  let maxNum = 0;
  if (invoices && invoices.length > 0) {
    for (const inv of invoices) {
      const num = inv.invoice_number;
      if (typeof num === 'string' && num.startsWith(prefix)) {
        const trailing = num.slice(prefix.length);
        const parsed = parseInt(trailing, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }
  }

  const nextNumber = `${prefix}${maxNum + 1}`;

  return NextResponse.json({ success: true, data: { invoice_number: nextNumber } });
}
