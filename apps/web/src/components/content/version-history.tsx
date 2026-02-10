'use client';

import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  ScrollArea,
  CcdSpinner,
  toast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@ccd/ui';
import { formatDate } from '@ccd/shared';
import { apiGet, apiPost } from '@/lib/api';
import { History, RotateCcw, GitCompare, Clock } from 'lucide-react';

interface ContentVersion {
  id: string;
  content_item_id: string;
  version_number: number;
  title: string;
  body: string | null;
  excerpt: string | null;
  metadata: Record<string, unknown>;
  status: string | null;
  created_by: string | null;
  created_at: string;
  snapshot_reason: string;
}

interface VersionHistoryProps {
  contentId: string;
  currentTitle: string;
  currentBody: string;
  onRestore?: () => void;
}

export function VersionHistory({ contentId, currentTitle, currentBody, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = React.useState<ContentVersion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [restoring, setRestoring] = React.useState<string | null>(null);
  const [creatingSnapshot, setCreatingSnapshot] = React.useState(false);

  const fetchVersions = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<ContentVersion[]>(`/api/content/${contentId}/versions`);
      setVersions(res.data ?? []);
    } catch {
      /* handled by apiGet */
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  React.useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  async function handleCreateSnapshot() {
    setCreatingSnapshot(true);
    try {
      await apiPost(`/api/content/${contentId}/versions`, { snapshot_reason: 'manual' });
      toast({ title: 'Snapshot Created', description: 'Manual version snapshot saved' });
      fetchVersions();
    } catch {
      toast({ title: 'Error', description: 'Failed to create snapshot', variant: 'destructive' });
    } finally {
      setCreatingSnapshot(false);
    }
  }

  async function handleRestore(versionId: string) {
    setRestoring(versionId);
    try {
      await apiPost(`/api/content/${contentId}/versions/${versionId}`, {});
      toast({ title: 'Restored', description: 'Content restored to selected version' });
      onRestore?.();
    } catch {
      toast({ title: 'Error', description: 'Failed to restore version', variant: 'destructive' });
    } finally {
      setRestoring(null);
    }
  }

  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="h-7 text-xs"
          >
            {creatingSnapshot ? <CcdSpinner size="sm" className="mr-1" /> : null}
            Save Snapshot
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <CcdSpinner size="sm" />
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No versions yet. Versions are created automatically when you save changes.
          </p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-start justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">v{version.version_number}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {version.snapshot_reason}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate" title={version.title}>
                      {version.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(version.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Compare">
                          <GitCompare className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>Compare v{version.version_number} with Current</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Version {version.version_number}
                            </h4>
                            <div className="rounded-md border p-3 space-y-2">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Title</span>
                                <p className="text-sm">{version.title}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Body</span>
                                <p className="text-sm whitespace-pre-wrap max-h-[300px] overflow-auto">
                                  {version.body ? stripHtml(version.body).slice(0, 2000) : '(empty)'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Current</h4>
                            <div className="rounded-md border p-3 space-y-2">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Title</span>
                                <p className="text-sm">{currentTitle}</p>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Body</span>
                                <p className="text-sm whitespace-pre-wrap max-h-[300px] overflow-auto">
                                  {currentBody ? stripHtml(currentBody).slice(0, 2000) : '(empty)'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title="Restore this version"
                      onClick={() => handleRestore(version.id)}
                      disabled={restoring === version.id}
                    >
                      {restoring === version.id ? (
                        <CcdSpinner size="sm" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
