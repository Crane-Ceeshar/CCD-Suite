'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  CcdLoader,
  EmptyState,
  ConfirmationDialog,
  toast,
} from '@ccd/ui';
import {
  Plus,
  LayoutDashboard,
  Trash2,
  Pencil,
  Star,
  ArrowLeft,
  Settings2,
  Share2,
  Link2,
  Copy,
} from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api';
import { formatDate } from '@ccd/shared';
import { DashboardGrid } from '@/components/analytics/dashboard-grid';
import { type Widget } from '@/components/analytics/widget-renderer';

// ── Types ─────────────────────────────────────────────────────────

interface DashboardItem {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

interface DashboardDetail extends DashboardItem {
  widgets: Widget[];
}

// ── Component ─────────────────────────────────────────────────────

export default function CustomDashboardsPage() {
  const [dashboards, setDashboards] = React.useState<DashboardItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  // Detail view state
  const [selectedDashboard, setSelectedDashboard] =
    React.useState<DashboardDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [sharing, setSharing] = React.useState(false);

  // ── List Data ───────────────────────────────────────────────────

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet<DashboardItem[]>('/api/analytics/dashboards');
      setDashboards(res.data ?? []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiPost('/api/analytics/dashboards', { name: newName.trim() });
      toast({ title: 'Created', description: 'Dashboard created successfully' });
      setNewName('');
      load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/analytics/dashboards/${id}`);
      toast({ title: 'Deleted', description: 'Dashboard deleted' });
      load();
    } catch {
      /* handled */
    }
  }

  // ── Detail View ─────────────────────────────────────────────────

  async function openDashboard(db: DashboardItem) {
    setDetailLoading(true);
    try {
      const res = await apiGet<DashboardDetail>(
        `/api/analytics/dashboards/${db.id}`
      );
      setSelectedDashboard(res.data);
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function handleBack() {
    setSelectedDashboard(null);
    setIsEditing(false);
    setShareUrl(null);
    load(); // refresh list in case widgets changed
  }

  async function handleShare() {
    if (!selectedDashboard) return;
    setSharing(true);
    try {
      const res = await apiPost<{ share_url: string; is_public: boolean }>(
        `/api/analytics/dashboards/${selectedDashboard.id}/share`,
        { is_public: !shareUrl }
      );
      if (res.data.is_public && res.data.share_url) {
        setShareUrl(res.data.share_url);
        await navigator.clipboard.writeText(res.data.share_url);
        toast({ title: 'Link Copied', description: 'Public share link copied to clipboard' });
      } else {
        setShareUrl(null);
        toast({ title: 'Sharing Disabled', description: 'Dashboard is now private' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle sharing', variant: 'destructive' });
    } finally {
      setSharing(false);
    }
  }

  async function handleWidgetsChange(updatedWidgets: Widget[]) {
    if (!selectedDashboard) return;

    const prev = selectedDashboard.widgets;
    setSelectedDashboard({ ...selectedDashboard, widgets: updatedWidgets });

    // Determine what changed: added, removed, or reordered
    const prevIds = new Set(prev.map((w) => w.id));
    const newIds = new Set(updatedWidgets.map((w) => w.id));

    // Handle removed widgets
    for (const widget of prev) {
      if (!newIds.has(widget.id)) {
        try {
          await fetch(`/api/analytics/dashboards/${selectedDashboard.id}/widgets`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ widgetId: widget.id }),
          });
        } catch {
          /* will reconcile on next load */
        }
      }
    }

    // Handle added widgets (temp ids)
    for (const widget of updatedWidgets) {
      if (widget.id.startsWith('temp-') && !prevIds.has(widget.id)) {
        try {
          const res = await apiPost<Widget>(
            `/api/analytics/dashboards/${selectedDashboard.id}/widgets`,
            {
              title: widget.title,
              widget_type: widget.widget_type,
              data_source: widget.data_source,
              config: widget.config,
              position: widget.position,
            }
          );
          // Replace the temp widget with the real one from the API
          if (res.data) {
            setSelectedDashboard((current) => {
              if (!current) return current;
              return {
                ...current,
                widgets: current.widgets.map((w) =>
                  w.id === widget.id ? res.data : w
                ),
              };
            });
          }
        } catch (err) {
          toast({
            title: 'Error',
            description:
              err instanceof Error ? err.message : 'Failed to add widget',
            variant: 'destructive',
          });
        }
      }
    }

    // Handle reorder: update positions for all widgets
    const reorderedWidgets = updatedWidgets.filter(
      (w) => !w.id.startsWith('temp-') && prevIds.has(w.id) && newIds.has(w.id)
    );
    for (let i = 0; i < reorderedWidgets.length; i++) {
      const widget = reorderedWidgets[i];
      const newPosition = { ...widget.position, x: 0, y: i };
      if (widget.position.y !== newPosition.y) {
        try {
          await apiPatch(
            `/api/analytics/dashboards/${selectedDashboard.id}/widgets`,
            { widgetId: widget.id, position: newPosition }
          );
        } catch {
          /* best effort */
        }
      }
    }
  }

  // ── Loading State ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  // ── Detail View ─────────────────────────────────────────────────

  if (selectedDashboard || detailLoading) {
    if (detailLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <CcdLoader size="lg" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title={selectedDashboard!.name}
          description={
            selectedDashboard!.description ?? 'Custom dashboard with widgets'
          }
          breadcrumbs={[
            { label: 'Analytics', href: '/analytics' },
            { label: 'Dashboards', href: '/analytics/dashboards' },
            { label: selectedDashboard!.name },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboards
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={sharing}
              >
                {shareUrl ? <Link2 className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                {shareUrl ? 'Unshare' : 'Share'}
              </Button>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                {isEditing ? 'Done Editing' : 'Edit Layout'}
              </Button>
            </div>
          }
        />

        <DashboardGrid
          dashboardId={selectedDashboard!.id}
          widgets={selectedDashboard!.widgets}
          onWidgetsChange={handleWidgetsChange}
          isEditing={isEditing}
        />
      </div>
    );
  }

  // ── List View (default) ─────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Dashboards"
        description="Build and share personalized data dashboards"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Custom Dashboards' },
        ]}
      />

      {/* Create new dashboard */}
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Dashboard name..."
            className="max-w-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Create Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Dashboard list */}
      {dashboards.length === 0 ? (
        <EmptyState
          icon={<LayoutDashboard className="h-6 w-6 text-muted-foreground" />}
          title="No Dashboards Yet"
          description="Create your first custom dashboard to start visualizing your data with charts, KPIs, and widgets."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((db) => (
            <Card
              key={db.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => openDashboard(db)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    {db.name}
                    {db.is_default && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </CardTitle>
                  {db.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {db.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDashboard(db);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <ConfirmationDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                    title="Delete Dashboard"
                    description={`Are you sure you want to delete "${db.name}"? This action cannot be undone.`}
                    confirmLabel="Delete"
                    variant="destructive"
                    onConfirm={() => handleDelete(db.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(db.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
