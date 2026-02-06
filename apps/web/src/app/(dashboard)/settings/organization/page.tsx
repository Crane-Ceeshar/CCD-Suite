import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ccd/ui';

export default function OrganizationSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>
          Manage your organization settings and branding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Organization settings coming soon.</p>
      </CardContent>
    </Card>
  );
}
