import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { createServiceClient } from '@/lib/supabase/service-client';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * POST /api/uploads/signed-url
 * Generate a signed upload URL for Supabase Storage.
 * The client uploads the file directly to storage using the signed URL.
 */
export async function POST(request: NextRequest) {
  const { error, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user!.id, {
    max: 100,
    keyPrefix: 'uploads:signed-url',
  });
  if (limited) return limitResp!;

  let body: { bucket: string; fileName: string; fileType: string; fileSize: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { bucket, fileName, fileType, fileSize } = body;

  if (!bucket || !fileName) {
    return NextResponse.json(
      { success: false, error: { message: 'bucket and fileName are required' } },
      { status: 400 }
    );
  }

  // Validate bucket name (only allow known buckets)
  const allowedBuckets = ['project-files', 'content-assets', 'avatars'];
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid storage bucket' } },
      { status: 400 }
    );
  }

  // File size limit: 500MB
  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: { message: `File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` } },
      { status: 400 }
    );
  }

  // Build a tenant-scoped storage path
  const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
  const safeName = `${crypto.randomUUID()}${ext}`;
  const path = `${profile!.tenant_id}/${safeName}`;

  try {
    const serviceClient = createServiceClient();

    const { data, error: storageError } = await serviceClient.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (storageError || !data) {
      console.error('Storage signed URL error:', storageError);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to generate upload URL' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        path,
        token: data.token,
      },
    });
  } catch (err) {
    console.error('Upload URL generation error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
