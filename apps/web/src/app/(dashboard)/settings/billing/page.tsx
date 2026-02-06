import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ccd/ui';

export default function BillingSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your subscription and billing information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Billing settings coming soon.</p>
      </CardContent>
    </Card>
  );
}
