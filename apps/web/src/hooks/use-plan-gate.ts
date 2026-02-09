'use client';

import { useAuthStore } from '@/stores/auth-store';
import { PLAN_TIER_ORDER } from '@ccd/shared';
import type { PlanTier } from '@ccd/shared';

export function usePlanGate() {
  const session = useAuthStore((s) => s.session);
  const plan = session?.tenant?.plan ?? 'starter';

  const isEnterprise = plan === 'enterprise' || plan === 'custom';
  const isProfessional = plan === 'professional' || isEnterprise;
  const isStarter = plan === 'starter';

  function canAccess(minTier: PlanTier): boolean {
    return (PLAN_TIER_ORDER[plan] ?? 0) >= (PLAN_TIER_ORDER[minTier] ?? 0);
  }

  const trialEndsAt = session?.tenant?.trial_ends_at;
  const isOnTrial = !!trialEndsAt && new Date(trialEndsAt) > new Date();
  const daysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  return { plan, isEnterprise, isProfessional, isStarter, isOnTrial, daysRemaining, canAccess };
}
