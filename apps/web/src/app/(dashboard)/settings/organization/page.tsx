import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ccd/ui';
import { Building2 } from 'lucide-react';

export default function OrganizationSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organization
          </CardTitle>
          <CardDescription>
            Manage your organization settings and branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Organization settings coming soon</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Configure your organization name, branding, domain, and general settings here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
