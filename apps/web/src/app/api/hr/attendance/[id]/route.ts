import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateAttendanceSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * PATCH /api/hr/attendance/:id
 * Update an attendance record. Recalculates hours_worked if clock times change.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:attendance:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateAttendanceSchema);
  if (bodyError) return bodyError;

  // Build update fields
  const updateFields: Record<string, unknown> = {};
  if (body.clock_in !== undefined) updateFields.clock_in = body.clock_in;
  if (body.clock_out !== undefined) updateFields.clock_out = body.clock_out;
  if (body.status !== undefined) updateFields.status = body.status;
  if (body.notes !== undefined) updateFields.notes = body.notes;

  // Recalculate hours_worked if clock times are changing
  if (body.clock_in !== undefined || body.clock_out !== undefined) {
    // Fetch existing record to get current clock times
    const { data: existing, error: fetchError } = await supabase
      .from('attendance')
      .select('clock_in, clock_out')
      .eq('id', id)
      .single();

    if (fetchError) {
      return dbError(fetchError, 'Attendance record');
    }

    const clockIn = body.clock_in !== undefined ? body.clock_in : existing.clock_in;
    const clockOut = body.clock_out !== undefined ? body.clock_out : existing.clock_out;

    if (clockIn && clockOut) {
      const cin = new Date(clockIn);
      const cout = new Date(clockOut);
      const diffMs = cout.getTime() - cin.getTime();
      updateFields.hours_worked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    } else {
      updateFields.hours_worked = null;
    }
  }

  const { data, error: updateError } = await supabase
    .from('attendance')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Attendance record');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'attendance.updated',
    resource_type: 'attendance',
    resource_id: id,
    details: { fields: Object.keys(updateFields) },
  });

  return success(data);
}
