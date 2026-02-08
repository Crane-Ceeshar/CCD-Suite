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

/* -------------------------------------------------------------------------- */
/*  Billing Settings Page                                                     */
/* -------------------------------------------------------------------------- */

export default function BillingSettingsPage() {
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
                  Free Trial
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  14 days remaining
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                You&apos;re on the free trial plan. Upgrade to unlock all features and remove limits.
              </p>
            </div>
            <Button disabled>
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
            value="3 / 10"
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
          />
          <StatCard
            label="Modules"
            value="5 / 11"
            icon={<Package className="h-5 w-5 text-muted-foreground" />}
          />
          <StatCard
            label="Storage"
            value="0.2 GB / 5 GB"
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
            <Button variant="outline" disabled>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
