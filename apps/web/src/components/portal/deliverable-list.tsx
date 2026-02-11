'use client';

import * as React from 'react';
import { Badge, Button, CcdSpinner } from '@ccd/ui';
import { FileText, Upload, Check, RotateCcw, Truck, Trash2, Download } from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  status: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  feedback: string | null;
  created_at: string;
  uploaded_by_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

interface DeliverableListProps {
  projectId: string;
  deliverables: Deliverable[];
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pending_review: { label: 'Pending Review', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Approved', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  revision_requested: { label: 'Revision Requested', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  delivered: { label: 'Delivered', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeliverableList({ projectId, deliverables, onRefresh }: DeliverableListProps) {
  const [updating, setUpdating] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [downloading, setDownloading] = React.useState<string | null>(null);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [feedbackForId, setFeedbackForId] = React.useState<string | null>(null);

  async function handleDownload(deliverable: Deliverable) {
    if (!deliverable.file_url) return;
    setDownloading(deliverable.id);
    try {
      const res = await fetch('/api/uploads/download-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: 'project-files', path: deliverable.file_url }),
      });
      const result = await res.json();
      if (result.success && result.data?.signedUrl) {
        // Open signed URL in new tab to trigger download
        const a = document.createElement('a');
        a.href = result.data.signedUrl;
        a.download = deliverable.file_name || 'download';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      // ignore
    } finally {
      setDownloading(null);
    }
  }

  async function handleStatusChange(deliverableId: string, newStatus: string, feedback?: string) {
    setUpdating(deliverableId);
    try {
      const payload: Record<string, unknown> = { status: newStatus };
      if (feedback) payload.feedback = feedback;
      await apiPatch(`/api/portal/projects/${projectId}/deliverables/${deliverableId}`, payload);
      setFeedbackForId(null);
      setFeedbackText('');
      onRefresh();
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(deliverableId: string) {
    setDeleting(deliverableId);
    try {
      await apiDelete(`/api/portal/projects/${projectId}/deliverables/${deliverableId}`);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  if (deliverables.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No deliverables uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {deliverables.map((d) => {
        const config = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.pending_review;

        return (
          <div key={d.id} className="flex items-start gap-3 py-3 px-3 rounded-lg border hover:bg-muted/30 group">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{d.title}</p>
                <Badge className={`text-xs ${config.badge}`}>{config.label}</Badge>
              </div>
              {d.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{d.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {d.file_name && <span>{d.file_name}</span>}
                {d.file_size && <span>{formatFileSize(d.file_size)}</span>}
                <span>{d.uploaded_by_profile?.full_name ?? 'Unknown'}</span>
                <span>{new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>

              {d.feedback && (
                <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                  <span className="font-medium">Feedback:</span> {d.feedback}
                </div>
              )}

              {/* Revision feedback input */}
              {feedbackForId === d.id && (
                <div className="mt-2 space-y-2">
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Describe what changes are needed..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => handleStatusChange(d.id, 'revision_requested', feedbackText)}
                      disabled={!feedbackText.trim() || updating === d.id}
                    >
                      {updating === d.id ? <CcdSpinner size="sm" className="mr-1" /> : <RotateCcw className="mr-1 h-3 w-3" />}
                      Request Revision
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setFeedbackForId(null); setFeedbackText(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {d.file_url && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => handleDownload(d)}
                  disabled={downloading === d.id}
                  title="Download file"
                >
                  {downloading === d.id ? <CcdSpinner size="sm" /> : <Download className="h-3.5 w-3.5" />}
                </Button>
              )}
              {d.status === 'pending_review' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleStatusChange(d.id, 'approved')}
                    disabled={updating === d.id}
                  >
                    {updating === d.id ? <CcdSpinner size="sm" /> : <Check className="mr-1 h-3 w-3" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setFeedbackForId(d.id)}
                  >
                    <RotateCcw className="mr-1 h-3 w-3" />
                    Revise
                  </Button>
                </>
              )}
              {d.status === 'approved' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleStatusChange(d.id, 'delivered')}
                  disabled={updating === d.id}
                >
                  {updating === d.id ? <CcdSpinner size="sm" /> : <Truck className="mr-1 h-3 w-3" />}
                  Mark Delivered
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(d.id)}
                disabled={deleting === d.id}
              >
                {deleting === d.id ? <CcdSpinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
