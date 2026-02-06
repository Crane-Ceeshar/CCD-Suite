import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Button } from '@ccd/ui';
import { FolderKanban, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Task management, workflows, and team coordination"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Projects" value="0" icon={<FolderKanban className="h-5 w-5 text-muted-foreground" />} moduleColor="#6366F1" />
        <StatCard label="Open Tasks" value="0" icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />} moduleColor="#6366F1" />
        <StatCard label="Hours Tracked" value="0h" icon={<Clock className="h-5 w-5 text-muted-foreground" />} moduleColor="#6366F1" />
        <StatCard label="Overdue" value="0" icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />} moduleColor="#6366F1" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/projects/board">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader><CardTitle className="text-base">Task Board</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Kanban board view for managing tasks</p></CardContent>
          </Card>
        </Link>
        <Link href="/projects/list">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader><CardTitle className="text-base">Task List</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">View and filter all tasks in a table</p></CardContent>
          </Card>
        </Link>
        <Link href="/projects/timeline">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Gantt-style timeline of project milestones</p></CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
