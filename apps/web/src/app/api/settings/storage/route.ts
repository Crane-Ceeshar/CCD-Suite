import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';
import { checkStorageQuota } from '@/lib/api/storage-quota';

/**
 * GET /api/settings/storage
 * Returns the current tenant's storage usage and quota.
 */
export async function GET(_request: NextRequest) {
  const { error: authError, user, profile } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, {
    max: 30,
    keyPrefix: 'settings:storage',
  });
  if (limited) return limitResp!;

  const quota = await checkStorageQuota(profile.tenant_id);

  return success({
    usedBytes: quota.usedBytes,
    usedGb: quota.usedGb,
    limitGb: quota.limitGb,
    percentUsed: quota.percentUsed,
    plan: quota.plan,
  });
}
