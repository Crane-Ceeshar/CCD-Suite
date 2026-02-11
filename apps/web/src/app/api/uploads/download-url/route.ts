import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { createServiceClient } from '@/lib/supabase/service-client';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * POST /api/uploads/download-url
 * Generate a signed download URL for a file in Supabase Storage.
 * Returns a time-limited URL (1 hour) that the browser can use to download the file.
 */
export async function POST(request: NextRequest) {
  const { error, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user!.id, {
    max: 200,
    keyPrefix: 'uploads:download-url',
  });
  if (limited) return limitResp!;

  let body: { bucket: string; path: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const { bucket, path } = body;

  if (!bucket || !path) {
    return NextResponse.json(
      { success: false, error: { message: 'bucket and path are required' } },
      { status: 400 }
    );
  }

  // Validate bucket
  const allowedBuckets = ['project-files', 'content-assets', 'avatars'];
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid storage bucket' } },
      { status: 400 }
    );
  }

  try {
    const serviceClient = createServiceClient();

    const { data, error: storageError } = await serviceClient.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (storageError || !data) {
      console.error('Storage download URL error:', storageError);
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
    console.error('Download URL generation error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
