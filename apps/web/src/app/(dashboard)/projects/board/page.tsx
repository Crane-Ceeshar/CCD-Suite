import { PageHeader, Button } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { TaskBoard } from '@/components/projects/task-board';

export default function TaskBoardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Board"
        description="Drag tasks between columns to update their status"
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: 'Board' }]}
        actions={<Button><Plus className="mr-2 h-4 w-4" />New Task</Button>}
      />
      <TaskBoard />
    </div>
  );
}
