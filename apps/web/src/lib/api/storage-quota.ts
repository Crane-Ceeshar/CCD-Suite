import { createServiceClient } from '@/lib/supabase/service-client';
import { PLAN_FEATURES } from '@ccd/shared';
import type { PlanTier } from '@ccd/shared';

const BYTES_PER_GB = 1024 * 1024 * 1024;

export interface StorageQuotaResult {
  allowed: boolean;
  usedBytes: number;
  limitBytes: number;
  usedGb: number;
  limitGb: number;
  percentUsed: number;
  plan: PlanTier;
}

/**
 * Check whether a tenant can upload a file of the given size.
 *
 * Uses the service client (bypasses RLS) to query:
 *   1. `get_tenant_storage_bytes()` — total bytes used across all buckets
 *   2. `tenants.plan` — to look up the plan's `maxStorageGb`
 *
 * @param tenantId  UUID of the tenant
 * @param fileSize  Size of the file to be uploaded (in bytes). Pass 0 to just query usage.
 */
export async function checkStorageQuota(
  tenantId: string,
  fileSize: number = 0,
): Promise<StorageQuotaResult> {
  const serviceClient = createServiceClient();

  // Run both queries in parallel
  const [usageResult, tenantResult] = await Promise.all([
    serviceClient.rpc('get_tenant_storage_bytes', { p_tenant_id: tenantId }),
    serviceClient
      .from('tenants')
      .select('plan')
      .eq('id', tenantId)
      .single(),
  ]);

  const usedBytes: number = (usageResult.data as number) ?? 0;
  const plan: PlanTier = (tenantResult.data?.plan as PlanTier) ?? 'starter';

  // Look up limit from plan features
  let maxStorageGb: number;
  if (plan === 'custom') {
    maxStorageGb = 500; // custom plans get 500 GB default
  } else {
    maxStorageGb = PLAN_FEATURES[plan].limits.maxStorageGb;
  }

  const limitBytes = maxStorageGb * BYTES_PER_GB;
  const usedGb = parseFloat((usedBytes / BYTES_PER_GB).toFixed(2));
  const percentUsed = limitBytes > 0
    ? parseFloat(((usedBytes / limitBytes) * 100).toFixed(1))
    : 0;

  return {
    allowed: usedBytes + fileSize <= limitBytes,
    usedBytes,
    limitBytes,
    usedGb,
    limitGb: maxStorageGb,
    percentUsed,
    plan,
  };
}
