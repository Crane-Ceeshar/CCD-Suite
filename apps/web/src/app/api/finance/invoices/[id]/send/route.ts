import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';
import { sendEmail } from '@/lib/email';

/**
 * POST /api/finance/invoices/:id/send
 * Mark an invoice as 'sent' and email it to the linked contact.
 * If no contact/email is linked, the invoice is still marked as sent.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'finance:invoices:send' });
  if (limited) return limitResp!;

  // Fetch invoice with contact, company, and items
  const [invoiceRes, itemsRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, company:companies(id,name), contact:contacts(id,first_name,last_name,email)')
      .eq('id', id)
      .single(),
    supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order', { ascending: true }),
  ]);

  if (invoiceRes.error) {
    return dbError(invoiceRes.error, 'Invoice');
  }

  const invoice = invoiceRes.data;

  if (!['draft', 'sent', 'overdue'].includes(invoice.status)) {
    return errorResponse('Only draft, sent, or overdue invoices can be sent', 400);
  }

  // Get tenant info for branding
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, slug')
    .eq('id', profile.tenant_id)
    .single();

  const tenantName = tenant?.name || 'Our Company';

  // Update status to sent (only changes if currently 'draft')
  const newStatus = invoice.status === 'draft' ? 'sent' : invoice.status;
  const { data, error: updateError } = await supabase
    .from('invoices')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Failed to send invoice');
  }

  // Send email to the contact if one is linked and has an email
  let emailSent = false;
  const contact = invoice.contact as { id: string; first_name: string; last_name: string; email: string } | null;

  if (contact?.email) {
    const items = (itemsRes.data ?? []) as {
      description: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }[];

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency || 'USD' }).format(amount);

    const contactName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Customer';
    const companyInfo = (invoice.company as { name: string } | null)?.name;

    // Build the line items HTML table
    const lineItemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eaeaea; font-size: 14px;">${item.description}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eaeaea; font-size: 14px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eaeaea; font-size: 14px; text-align: right;">${formatCurrency(item.unit_price)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eaeaea; font-size: 14px; text-align: right;">${formatCurrency(item.amount)}</td>
        </tr>`
      )
      .join('');

    const dueDateLine = invoice.due_date
      ? `<p style="margin: 0 0 8px; font-size: 14px; color: #555;"><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`
      : '';

    const notesSection = invoice.notes
      ? `<div style="margin-top: 24px; padding: 16px; background-color: #f9f9f9; border-radius: 8px;">
           <p style="margin: 0; font-size: 13px; color: #666;"><strong>Notes:</strong> ${invoice.notes}</p>
         </div>`
      : '';

    const emailHtml = `
      <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 0; color: #1a1a2e;">
        <!-- Header -->
        <div style="background-color: #004a99; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 700;">${tenantName}</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">Invoice ${invoice.invoice_number}</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #eaeaea; border-top: none;">
          <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6;">Hi ${contactName},</p>
          <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
            Please find your invoice below${companyInfo ? ` for <strong>${companyInfo}</strong>` : ''}.
          </p>

          <!-- Invoice Info -->
          <div style="margin-bottom: 24px; padding: 16px; background-color: #f7f8fa; border-radius: 8px;">
            <p style="margin: 0 0 8px; font-size: 14px; color: #555;"><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #555;"><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            ${dueDateLine}
          </div>

          <!-- Line Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f7f8fa;">
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Description</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Unit Price</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="border-top: 2px solid #eaeaea; padding-top: 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 12px; font-size: 14px; color: #666; text-align: right;">Subtotal</td>
                <td style="padding: 4px 12px; font-size: 14px; text-align: right; width: 120px;">${formatCurrency(invoice.subtotal)}</td>
              </tr>
              ${invoice.tax_amount > 0 ? `
              <tr>
                <td style="padding: 4px 12px; font-size: 14px; color: #666; text-align: right;">Tax (${invoice.tax_rate}%)</td>
                <td style="padding: 4px 12px; font-size: 14px; text-align: right;">${formatCurrency(invoice.tax_amount)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 12px 12px 4px; font-size: 18px; font-weight: 700; text-align: right; border-top: 2px solid #1a1a2e;">Total Due</td>
                <td style="padding: 12px 12px 4px; font-size: 18px; font-weight: 700; text-align: right; border-top: 2px solid #1a1a2e;">${formatCurrency(invoice.total)}</td>
              </tr>
            </table>
          </div>

          ${notesSection}
        </div>

        <!-- Footer -->
        <div style="padding: 24px; background-color: #f7f8fa; border: 1px solid #eaeaea; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #888;">
            This invoice was generated by ${tenantName} via CCD Suite.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: contact.email,
        subject: `Invoice ${invoice.invoice_number} from ${tenantName}`,
        html: emailHtml,
      });
      emailSent = true;
    } catch (err) {
      // Log the error but don't fail the request — invoice is already marked as sent
      console.error('Failed to send invoice email:', err instanceof Error ? err.message : err);
    }
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'invoice.sent',
    resource_type: 'invoice',
    resource_id: id,
    details: {
      invoice_number: invoice.invoice_number,
      email_sent: emailSent,
      recipient: contact?.email || null,
    },
  });

  return success({ ...data, email_sent: emailSent, recipient_email: contact?.email || null });
}
