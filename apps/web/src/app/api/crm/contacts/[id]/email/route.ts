import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { sendEmail } from '@/lib/email';
import { stripHtmlTags } from '@/lib/api/sanitize';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const { subject, body_html, deal_id } = body as {
    subject: string;
    body_html: string;
    deal_id?: string;
  };

  if (!subject?.trim() || !body_html?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: 'Subject and body are required' } },
      { status: 400 }
    );
  }

  // Fetch the contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, email, first_name, last_name, company_id')
    .eq('id', id)
    .single();

  if (contactError || !contact) {
    return NextResponse.json(
      { success: false, error: { message: 'Contact not found' } },
      { status: 404 }
    );
  }

  if (!contact.email) {
    return NextResponse.json(
      { success: false, error: { message: 'Contact has no email address' } },
      { status: 400 }
    );
  }

  // Send the email
  try {
    await sendEmail({
      to: contact.email,
      subject,
      html: body_html,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err instanceof Error ? err.message : 'Failed to send email' } },
      { status: 500 }
    );
  }

  // Log as activity with email metadata
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .insert({
      tenant_id: profile.tenant_id,
      type: 'email',
      title: `Email: ${subject}`,
      description: stripHtmlTags(body_html).substring(0, 500),
      contact_id: id,
      company_id: contact.company_id,
      deal_id: deal_id || null,
      is_completed: true,
      completed_at: new Date().toISOString(),
      email_metadata: {
        subject,
        to: contact.email,
        sent_at: new Date().toISOString(),
        body_preview: stripHtmlTags(body_html).substring(0, 200),
      },
      created_by: user.id,
    })
    .select()
    .single();

  if (activityError) {
    // Email was sent but activity log failed - still return success
    return NextResponse.json({
      success: true,
      data: { email_sent: true, activity_logged: false },
    });
  }

  return NextResponse.json({
    success: true,
    data: { email_sent: true, activity_logged: true, activity_id: activity.id },
  });
}
