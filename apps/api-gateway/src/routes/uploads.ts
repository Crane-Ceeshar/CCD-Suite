import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { PLAN_FEATURES } from '@ccd/shared';
import type { PlanTier } from '@ccd/shared';

const BYTES_PER_GB = 1024 * 1024 * 1024;

const BUCKET_LIMITS: Record<string, { maxSize: number; allowedTypes?: string[] }> = {
  avatars: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  'content-assets': {
    maxSize: 50 * 1024 * 1024,
  },
  'project-files': {
    maxSize: 100 * 1024 * 1024,
  },
};

export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);

  // Get signed upload URL
  fastify.post<{
    Body: {
      bucket: string;
      fileName: string;
      fileType: string;
      fileSize: number;
    };
  }>('/signed-url', async (request, reply) => {
    const { bucket, fileName, fileType, fileSize } = request.body;

    // Validate bucket
    const limits = BUCKET_LIMITS[bucket];
    if (!limits) {
      reply.status(400).send({
        success: false,
        error: { code: 'INVALID_BUCKET', message: `Invalid bucket: ${bucket}` },
      });
      return;
    }

    // Validate file size
    if (fileSize > limits.maxSize) {
      reply.status(400).send({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File exceeds maximum size of ${limits.maxSize / (1024 * 1024)}MB`,
        },
      });
      return;
    }

    // Validate file type
    if (limits.allowedTypes && !limits.allowedTypes.includes(fileType)) {
      reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: `File type ${fileType} is not allowed for this bucket`,
        },
      });
      return;
    }

    // Storage quota check (skip avatars — tiny files)
    if (bucket !== 'avatars' && fileSize) {
      const { data: usedBytes } = await fastify.supabase.rpc('get_tenant_storage_bytes', {
        p_tenant_id: request.tenantId,
      });
      const { data: tenant } = await fastify.supabase
        .from('tenants')
        .select('plan')
        .eq('id', request.tenantId)
        .single();

      const plan: PlanTier = (tenant?.plan as PlanTier) ?? 'starter';
      const maxGb = plan === 'custom' ? 500 : PLAN_FEATURES[plan].limits.maxStorageGb;
      const limitBytes = maxGb * BYTES_PER_GB;
      const used = (usedBytes as number) ?? 0;

      if (used + fileSize > limitBytes) {
        const usedGb = (used / BYTES_PER_GB).toFixed(2);
        reply.status(403).send({
          success: false,
          error: {
            code: 'STORAGE_QUOTA_EXCEEDED',
            message: `Storage quota exceeded. Using ${usedGb} GB of ${maxGb} GB. Upgrade your plan for more storage.`,
          },
        });
        return;
      }
    }

    // Generate file path: tenantId/userId/timestamp-filename
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${request.tenantId}/${request.userId}/${timestamp}-${safeName}`;

    // Create signed upload URL
    const { data, error } = await fastify.supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: {
        signedUrl: data.signedUrl,
        path: data.path,
        token: data.token,
      },
    };
  });

  // Get signed download URL
  fastify.post<{
    Body: { bucket: string; path: string };
  }>('/download-url', async (request) => {
    const { bucket, path } = request.body;

    const { data, error } = await fastify.supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;

    return {
      success: true,
      data: { signedUrl: data.signedUrl },
    };
  });

  // Delete file
  fastify.delete<{
    Body: { bucket: string; paths: string[] };
  }>('/', async (request) => {
    const { bucket, paths } = request.body;

    const { error } = await fastify.supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) throw error;

    return { success: true };
  });
}
