import { PageHeader, EmptyState } from '@ccd/ui';
import { PenTool } from 'lucide-react';

export default function ContentEditorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Editor"
        description="Create and edit content"
        breadcrumbs={[{ label: 'Content', href: '/content' }, { label: 'Editor' }]}
      />
      <EmptyState
        icon={<PenTool className="h-6 w-6 text-muted-foreground" />}
        title="Rich Content Editor"
        description="The Tiptap-based rich content editor will be available here. Select a content piece to edit or create a new one."
      />
    </div>
  );
}
