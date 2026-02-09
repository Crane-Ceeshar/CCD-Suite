'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  EmptyState,
  StatCard,
} from '@ccd/ui';
import {
  CreditCard,
  Zap,
  Users,
  Package,
  HardDrive,
  Clock,
  Receipt,
} from 'lucide-react';
import { PLAN_FEATURES } from '@ccd/shared';
import type { PlanTier } from '@ccd/shared';
import { useAuthStore } from '@/stores/auth-store';
import { usePlanGate } from '@/hooks/use-plan-gate';
import { apiGet } from '@/lib/api';
import { PricingDialog } from '@/components/settings/pricing-dialog';
import { PaymentMethodDialog } from '@/components/settings/payment-method-dialog';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getPlanInfo(plan: PlanTier) {
  if (plan === 'custom') {
    return {
      name: 'Custom',
      monthlyPrice: 0,
      limits: { maxUsers: -1, maxModules: 11, maxStorageGb: 500 },
    };
  }
  return PLAN_FEATURES[plan];
}

/* -------------------------------------------------------------------------- */
/*  Billing Settings Page                                                     */
/* -------------------------------------------------------------------------- */

export default function BillingSettingsPage() {
  const session = useAuthStore((s) => s.session);
  const { plan, isOnTrial, daysRemaining } = usePlanGate();

  const [pricingOpen, setPricingOpen] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [memberCount, setMemberCount] = React.useState<number>(0);
  const [loadingMembers, setLoadingMembers] = React.useState(true);

  const planInfo = getPlanInfo(plan);
  const modulesEnabled = session?.tenant?.settings?.modules_enabled?.length ?? 0;

  React.useEffect(() => {
    let cancelled = false;
    async function fetchMembers() {
      try {
        const res = await apiGet<{ members: unknown[] }>('/api/team/members');
        if (!cancelled) {
          const members = res.data?.members;
          setMemberCount(Array.isArray(members) ? members.length : 0);
        }
      } catch {
        if (!cancelled) setMemberCount(0);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }
    fetchMembers();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxUsersLabel =
    planInfo.limits.maxUsers === -1
      ? 'Unlimited'
      : String(planInfo.limits.maxUsers);

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your subscription and plan details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-sm">
                  {planInfo.name}
                </Badge>
                {isOnTrial && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="mr-1 h-3 w-3" />
                    Trial - {daysRemaining} days remaining
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {plan === 'custom' ? (
                  'You are on a custom plan. Contact your account manager for details.'
                ) : (
                  <>
                    <span className="font-semibold text-foreground">
                      ${planInfo.monthlyPrice}/mo
                    </span>
                    {' '}
                    &mdash; {isOnTrial
                      ? 'Upgrade to keep access after your trial ends.'
                      : 'Upgrade to unlock more features and higher limits.'}
                  </>
                )}
              </p>
            </div>
            <Button onClick={() => setPricingOpen(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Usage Overview</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <StatCard
            label="Members"
            value={
              loadingMembers
                ? '...'
                : `${memberCount} / ${maxUsersLabel}`
            }
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
          />
          <StatCard
            label="Modules"
            value={`${modulesEnabled} / ${planInfo.limits.maxModules}`}
            icon={<Package className="h-5 w-5 text-muted-foreground" />}
          />
          <StatCard
            label="Storage"
            value={`0.2 GB / ${planInfo.limits.maxStorageGb} GB`}
            icon={<HardDrive className="h-5 w-5 text-muted-foreground" />}
          />
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5 text-primary" />
            Billing History
          </CardTitle>
          <CardDescription>
            Your past invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Empty table with column headers */}
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="p-0">
                      <EmptyState
                        icon={<Receipt className="h-5 w-5 text-muted-foreground" />}
                        title="No billing history"
                        description="Your invoices and payment records will appear here."
                        className="min-h-[200px] border-0"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Manage your payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border/60 p-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                No payment method configured
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add a payment method to upgrade your plan and manage subscriptions.
              </p>
            </div>
            <Button variant="outline" onClick={() => setPaymentOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
      <PaymentMethodDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  );
}
