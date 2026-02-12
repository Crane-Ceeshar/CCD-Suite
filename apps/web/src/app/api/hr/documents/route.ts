import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, error as apiError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';
import { z } from 'zod';

const createDocumentSchema = z.object({
  employee_id: z.string().uuid(),
  name: z.string().min(1, 'Document name is required').max(255),
  type: z.enum(['offer_letter', 'contract', 'id_document', 'certification', 'tax_form', 'other']),
  file_url: z.string().max(2000).nullable().optional(),
  file_size: z.number().nonnegative().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

/**
 * GET /api/hr/documents
 * List documents for an employee.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:documents:list' });
  if (limited) return limitResp!;

  const employeeId = request.nextUrl.searchParams.get('employee_id');
  if (!employeeId) {
    return apiError('employee_id is required', 400);
  }

  const { data, error: queryError } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch documents');
  }

  return NextResponse.json({ success: true, data });
}

/**
 * POST /api/hr/documents
 * Upload/create a document record.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:documents:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createDocumentSchema);
  if (bodyError) return bodyError;

  const { data: doc, error: insertError } = await supabase
    .from('employee_documents')
    .insert({
      tenant_id: profile.tenant_id,
      employee_id: body.employee_id,
      name: body.name,
      type: body.type,
      file_url: body.file_url ?? null,
      file_size: body.file_size ?? null,
      expiry_date: body.expiry_date ?? null,
      notes: body.notes ?? null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create document');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'document.uploaded',
    resource_type: 'employee_document',
    resource_id: doc.id,
    details: { employee_id: body.employee_id, name: body.name, type: body.type },
  });

  return success(doc, 201);
}
