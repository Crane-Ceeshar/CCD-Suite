'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
} from '@ccd/ui';
import { Handshake, FileText, Search, X, Plus, Link2 } from 'lucide-react';
import { apiPost, apiDelete } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ProjectLink {
  id: string;
  linked_entity_type: string;
  linked_entity_id: string;
  linked_entity_name?: string;
  created_at: string;
}

export interface ProjectLinksCardProps {
  projectId: string;
  links: ProjectLink[];
  onRefresh: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ENTITY_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  deal: {
    label: 'Deal',
    icon: <Handshake className="h-4 w-4" />,
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  content_item: {
    label: 'Content',
    icon: <FileText className="h-4 w-4" />,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  seo_project: {
    label: 'SEO Project',
    icon: <Search className="h-4 w-4" />,
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProjectLinksCard({ projectId, links, onRefresh }: ProjectLinksCardProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  async function handleDelete(linkId: string) {
    setDeleting(linkId);
    try {
      await apiDelete(`/api/projects/${projectId}/links?linkId=${linkId}`);
      onRefresh();
    } catch {
      // Silently fail — refresh will show current state
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            Linked Items
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Link
          </Button>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No linked items yet. Link deals, content, or SEO projects.
            </p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => {
                const config = ENTITY_TYPE_CONFIG[link.linked_entity_type];
                return (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground shrink-0">
                        {config?.icon ?? <Link2 className="h-4 w-4" />}
                      </span>
                      <span className="truncate">
                        {link.linked_entity_name ?? link.linked_entity_id}
                      </span>
                      <Badge className={`shrink-0 text-[10px] ${config?.badgeClass ?? ''}`}>
                        {config?.label ?? link.linked_entity_type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(link.id)}
                      disabled={deleting === link.id}
                    >
                      {deleting === link.id ? (
                        <CcdSpinner size="sm" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddLinkDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        onSuccess={() => {
          setAddOpen(false);
          onRefresh();
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Link Dialog                                                    */
/* ------------------------------------------------------------------ */

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

function AddLinkDialog({ open, onOpenChange, projectId, onSuccess }: AddLinkDialogProps) {
  const [entityType, setEntityType] = React.useState('deal');
  const [entityId, setEntityId] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setEntityType('deal');
      setEntityId('');
      setError('');
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!entityId.trim()) {
      setError('Entity ID is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiPost(`/api/projects/${projectId}/links`, {
        linked_entity_type: entityType,
        linked_entity_id: entityId.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Linked Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="link-type">Entity Type</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger id="link-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deal">Deal</SelectItem>
                <SelectItem value="content_item">Content Item</SelectItem>
                <SelectItem value="seo_project">SEO Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="link-entity-id">Entity ID</Label>
            <Input
              id="link-entity-id"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Enter the entity ID..."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              Add Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
