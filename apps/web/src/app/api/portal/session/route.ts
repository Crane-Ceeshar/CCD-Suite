import { NextRequest, NextResponse } from 'next/server';
import { setClientSession, clearClientSession, type ClientSession } from '@/lib/portal/client-session';

/**
 * POST /api/portal/session
 * Sets the client session cookie after successful token verification.
 * Called from the verify page after POST /api/portal/verify succeeds.
 */
export async function POST(request: NextRequest) {
  let body: Partial<ClientSession>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { token_id, client_email, tenant_id, portal_project_id } = body;

  if (!token_id || !client_email || !tenant_id) {
    return NextResponse.json(
      { success: false, error: { message: 'Missing required session fields' } },
      { status: 400 }
    );
  }

  const session: ClientSession = {
    token_id,
    client_email,
    tenant_id,
    portal_project_id: portal_project_id ?? null,
  };

  const response = NextResponse.json({ success: true, data: { session_set: true } });
  setClientSession(response, session);
  return response;
}

/**
 * DELETE /api/portal/session
 * Clears the client session cookie (logout).
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, data: { session_cleared: true } });
  clearClientSession(response);
  return response;
}
