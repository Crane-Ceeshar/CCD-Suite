import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ccd/ui';
import { User } from 'lucide-react';

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
            <User className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Profile settings coming soon</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Update your name, email, avatar, and personal preferences here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
