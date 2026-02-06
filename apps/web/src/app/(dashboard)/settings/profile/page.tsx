import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ccd/ui';

export default function ProfileSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Manage your personal information and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Profile settings coming soon.</p>
      </CardContent>
    </Card>
  );
}
