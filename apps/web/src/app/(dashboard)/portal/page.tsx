import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { FolderOpen, FileCheck, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';

export default function PortalDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Portal"
        description="External client collaboration and communication"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Projects"
          value="0"
          trend="neutral"
          icon={<FolderOpen className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#06B6D4"
        />
        <StatCard
          label="Pending Deliverables"
          value="0"
          change="Awaiting review"
          trend="neutral"
          icon={<FileCheck className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#06B6D4"
        />
        <StatCard
          label="Unread Messages"
          value="0"
          trend="neutral"
          icon={<MessageSquare className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#06B6D4"
        />
        <StatCard
          label="Clients"
          value="0"
          trend="neutral"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#06B6D4"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/portal/projects">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage client-facing projects, milestones, and deliverables
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/portal/projects/new">
          <Card className="cursor-pointer transition-shadow hover:shadow-md border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Create Portal Project</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Set up a new client portal project with milestones
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
