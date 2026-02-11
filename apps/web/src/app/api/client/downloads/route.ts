import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/portal/client-session';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * POST /api/client/downloads
 * Generate a signed download URL for a deliverable file.
 * Uses client portal session auth (magic link cookie).
 */
export async function POST(request: NextRequest) {
  const session = getClientSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  let body: { bucket: string; path: string; deliverableId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { bucket, path, deliverableId } = body;

  if (!bucket || !path) {
    return NextResponse.json(
      { success: false, error: { message: 'bucket and path are required' } },
      { status: 400 }
    );
  }

  // Only allow project-files bucket for client downloads
  if (bucket !== 'project-files') {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid storage bucket' } },
      { status: 400 }
    );
  }

  // Verify the file belongs to the client's tenant by checking the path prefix
  // Storage paths are structured as: {tenant_id}/{uuid}.{ext}
  if (!path.startsWith(`${session.tenant_id}/`)) {
    return NextResponse.json(
      { success: false, error: { message: 'Access denied' } },
      { status: 403 }
    );
  }

  // If deliverableId is provided, additionally verify the deliverable belongs to
  // a project the client has access to
  if (deliverableId) {
    const supabase = createServiceClient();
    const { data: deliverable } = await supabase
      .from('portal_deliverables')
      .select('id, portal_project_id')
      .eq('id', deliverableId)
      .single();

    if (!deliverable) {
      return NextResponse.json(
        { success: false, error: { message: 'Deliverable not found' } },
        { status: 404 }
      );
    }

    // If session is project-scoped, verify access
    if (session.portal_project_id && session.portal_project_id !== deliverable.portal_project_id) {
      return NextResponse.json(
        { success: false, error: { message: 'Access denied to this deliverable' } },
        { status: 403 }
      );
    }
  }

  try {
    const serviceClient = createServiceClient();

    const { data, error: storageError } = await serviceClient.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (storageError || !data) {
      console.error('Client download URL error:', storageError);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to generate download URL' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
      },
    });
  } catch (err) {
    console.error('Client download URL generation error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
