'use client';

import { useState } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Textarea,
} from '@ccd/ui';
import { FileText, Plus, Search, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useContractTemplates, useCreateTemplate, useDeleteTemplate } from '@/hooks/use-hr';

export default function ContractTemplatesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const { data: response, isLoading } = useContractTemplates({ search });
  const templates = (response?.data as any[]) ?? [];

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createTemplate.mutateAsync({
        name: name.trim(),
        description: description.trim() || null,
        content: [{ title: 'Terms and Conditions', content: '' }],
        variables: [],
      });
      setDialogOpen(false);
      setName('');
      setDescription('');
    } catch {
      // error handled by React Query
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Contract Templates"
          description="Manage reusable contract templates"
        >
          <Link href="/hr/contracts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contracts
            </Button>
          </Link>
        </PageHeader>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Templates Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a contract template to speed up contract creation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template: any) => (
            <Card key={template.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{template.name}</h3>
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {Array.isArray(template.content) ? template.content.length : 0} section(s)
                      {' · '}Created {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTemplate.mutate(template.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Contract Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Employment Agreement"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the template..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createTemplate.isPending || !name.trim()}>
              {createTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
