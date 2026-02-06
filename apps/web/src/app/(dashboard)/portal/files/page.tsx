import { PageHeader } from '@ccd/ui';
import { FileArchive } from 'lucide-react';

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        description="Shared files and documents with clients"
        breadcrumbs={[
          { label: 'Client Portal', href: '/portal' },
          { label: 'Files' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <FileArchive className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">File sharing coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Upload, organize, and share files with clients in a secure branded portal.
        </p>
      </div>
    </div>
  );
}
