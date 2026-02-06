import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ccd/ui';

export default function TeamSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>
          Manage team members and user types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Team management coming soon.</p>
      </CardContent>
    </Card>
  );
}
