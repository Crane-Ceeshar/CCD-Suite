'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Card,
  CardContent,
  Button,
  Badge,
  toast,
} from '@ccd/ui';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { PLAN_FEATURES } from '@ccd/shared';
import type { PlanTier } from '@ccd/shared';
import { usePlanGate } from '@/hooks/use-plan-gate';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const planIcons: Record<string, React.ReactNode> = {
  starter: <Star className="h-5 w-5" />,
  professional: <Zap className="h-5 w-5" />,
  enterprise: <Crown className="h-5 w-5" />,
};

const planKeys: Exclude<PlanTier, 'custom'>[] = ['starter', 'professional', 'enterprise'];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  const { plan: currentPlan } = usePlanGate();
  const [annual, setAnnual] = React.useState(false);

  function handleSelectPlan(tier: Exclude<PlanTier, 'custom'>) {
    if (tier === currentPlan) return;
    toast({
      title: 'Plan change requested',
      description:
        "You'll be contacted by our team to complete the upgrade.",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the plan that works best for your team
          </DialogDescription>
        </DialogHeader>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              !annual
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              annual
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            <Badge variant="secondary" className="ml-2 text-[10px]">
              Save ~17%
            </Badge>
          </button>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planKeys.map((tier) => {
            const planInfo = PLAN_FEATURES[tier];
            const isCurrent = tier === currentPlan || (currentPlan === 'custom' && tier === 'enterprise');
            const price = annual
              ? Math.round(planInfo.annualPrice / 12)
              : planInfo.monthlyPrice;

            return (
              <Card
                key={tier}
                className={`relative flex flex-col ${
                  planInfo.highlighted
                    ? 'border-primary border-2 shadow-md'
                    : ''
                }`}
              >
                {planInfo.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-[10px]">
                      Recommended
                    </Badge>
                  </div>
                )}
                <CardContent className="flex flex-col flex-1 p-6">
                  {/* Plan Name & Icon */}
                  <div className="flex items-center gap-2 mb-2">
                    {planIcons[tier]}
                    <h3 className="text-lg font-semibold">{planInfo.name}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4">
                    {planInfo.description}
                  </p>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${price}</span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                    {annual && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${planInfo.annualPrice}/year billed annually
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="rounded-lg bg-muted/50 p-3 mb-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Users</span>
                      <span className="font-medium">
                        {planInfo.limits.maxUsers === -1
                          ? 'Unlimited'
                          : `Up to ${planInfo.limits.maxUsers}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modules</span>
                      <span className="font-medium">
                        Up to {planInfo.limits.maxModules}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage</span>
                      <span className="font-medium">
                        {planInfo.limits.maxStorageGb} GB
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {planInfo.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={planInfo.highlighted ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleSelectPlan(tier)}
                    >
                      Select Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
