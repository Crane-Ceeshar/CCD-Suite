import { PageHeader, Button } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { ContentTable } from '@/components/content/content-table';

export default function ContentLibraryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Library"
        description="Browse and manage all your content"
        breadcrumbs={[{ label: 'Content', href: '/content' }, { label: 'Library' }]}
        actions={<Button><Plus className="mr-2 h-4 w-4" />New Content</Button>}
      />
      <ContentTable />
    </div>
  );
}
