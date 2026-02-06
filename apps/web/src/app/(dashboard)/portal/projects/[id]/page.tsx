'use client';

import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@ccd/ui';
import { ArrowLeft, Send, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const milestoneStatusIcons: Record<string, any> = {
  upcoming: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  overdue: AlertCircle,
};

const milestoneStatusColors: Record<string, string> = {
  upcoming: 'text-muted-foreground',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  overdue: 'text-red-500',
};

const deliverableStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_review: { label: 'Pending Review', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  revision_requested: { label: 'Revision Requested', variant: 'destructive' },
  delivered: { label: 'Delivered', variant: 'outline' },
};

export default function PortalProjectDetailPage() {
  // Placeholder — will fetch from API
  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Details"
        description="Manage milestones, deliverables, and communication"
      >
        <div className="flex gap-2">
          <Link href="/portal/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Invite Client
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Milestones</CardTitle>
              <Button variant="outline" size="sm">Add Milestone</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">No milestones yet. Add milestones to track project progress.</p>
              </div>
            </CardContent>
          </Card>

          {/* Deliverables */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Deliverables</CardTitle>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No deliverables uploaded yet.</p>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet. Start a conversation with your client.
                </p>
              </div>
              <div className="flex gap-2">
                <textarea
                  className="flex min-h-[80px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Type your message..."
                />
              </div>
              <div className="flex justify-between mt-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" className="rounded" />
                  Internal note (hidden from client)
                </label>
                <Button size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge>Active</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: '0%' }} />
                  </div>
                  <span className="text-sm font-medium">0%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Timeline</p>
                <p className="text-sm">Not set</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="text-sm">No client assigned</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
