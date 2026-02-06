import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ccd/ui';
import { Users } from 'lucide-react';

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team
          </CardTitle>
          <CardDescription>
            Manage team members and user types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Team management coming soon</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Invite team members, assign roles, and manage permissions here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
