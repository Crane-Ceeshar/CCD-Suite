import { PageHeader, Button } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { TaskList } from '@/components/projects/task-list';

export default function TaskListPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="All Tasks"
        description="View and manage tasks across all projects"
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: 'Tasks' }]}
        actions={<Button><Plus className="mr-2 h-4 w-4" />New Task</Button>}
      />
      <TaskList />
    </div>
  );
}
