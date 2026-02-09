'use client';

import * as React from 'react';
import { Card, CardContent, Badge, Button } from '@ccd/ui';
import { Lock } from 'lucide-react';
import { usePlanGate } from '@/hooks/use-plan-gate';
import { PricingDialog } from '@/components/settings/pricing-dialog';

/* -------------------------------------------------------------------------- */
/*  Enterprise Gate Component                                                  */
/* -------------------------------------------------------------------------- */

interface EnterpriseGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function EnterpriseGate({ children, feature }: EnterpriseGateProps) {
  const { isEnterprise, plan } = usePlanGate();
  const [pricingOpen, setPricingOpen] = React.useState(false);

  if (isEnterprise) {
    return <>{children}</>;
  }

  return (
    <>
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Enterprise Feature</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            {feature || 'This feature'} is available on the Enterprise plan.
          </p>
          <Badge variant="outline" className="mb-6 capitalize">
            Current plan: {plan}
          </Badge>
          <Button onClick={() => setPricingOpen(true)}>View Plans</Button>
        </CardContent>
      </Card>

      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  );
}
