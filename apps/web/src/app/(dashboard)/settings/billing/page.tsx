import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ccd/ui';
import { CreditCard } from 'lucide-react';

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Billing
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Billing settings coming soon</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Subscription management, invoices, and payment methods will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
