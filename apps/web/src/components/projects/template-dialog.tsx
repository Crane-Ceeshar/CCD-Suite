'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Badge,
  CcdSpinner,
} from '@ccd/ui';
import { FolderKanban, CheckSquare, ListTodo } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TemplateProject {
  id: string;
  name: string;
  description: string | null;
  task_count: number;
}

interface TemplateTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (projectId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRIORITY_DOTS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-slate-400',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TemplateDialog({ open, onOpenChange, onSuccess }: TemplateDialogProps) {
  const [templates, setTemplates] = React.useState<TemplateProject[]>([]);
  const [loadingTemplates, setLoadingTemplates] = React.useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);
  const [templateTasks, setTemplateTasks] = React.useState<TemplateTask[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(false);

  const [projectName, setProjectName] = React.useState('');
  const [projectDescription, setProjectDescription] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  // Load templates list when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedTemplateId(null);
      setTemplateTasks([]);
      setProjectName('');
      setProjectDescription('');
      setError('');

      setLoadingTemplates(true);
      apiGet<TemplateProject[]>('/api/projects/templates')
        .then((res) => setTemplates(res.data))
        .catch(() => setTemplates([]))
        .finally(() => setLoadingTemplates(false));
    }
  }, [open]);

  // Load template tasks when a template is selected
  React.useEffect(() => {
    if (!selectedTemplateId) {
      setTemplateTasks([]);
      return;
    }

    setLoadingTasks(true);
    apiGet<TemplateTask[]>(`/api/projects/${selectedTemplateId}/tasks?limit=100`)
      .then((res) => setTemplateTasks(res.data))
      .catch(() => setTemplateTasks([]))
      .finally(() => setLoadingTasks(false));
  }, [selectedTemplateId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await apiPost<{ id: string }>('/api/projects/templates', {
        template_project_id: selectedTemplateId,
        name: projectName.trim(),
        description: projectDescription.trim() || null,
      });
      onSuccess(res.data.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project from template');
    } finally {
      setSaving(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Project from Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Split layout: templates list + preview */}
          <div className="grid grid-cols-2 gap-4 min-h-[280px]">
            {/* Left: template list */}
            <div className="border rounded-md overflow-y-auto max-h-[300px]">
              <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0">
                Templates
              </div>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <CcdSpinner size="sm" />
                </div>
              ) : templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <FolderKanban className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No templates available</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Mark a project as a template to use it here.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${
                        selectedTemplateId === template.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <p className="text-sm font-medium truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <ListTodo className="h-3 w-3" />
                        {template.task_count} {template.task_count === 1 ? 'task' : 'tasks'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: task preview */}
            <div className="border rounded-md overflow-y-auto max-h-[300px]">
              <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0">
                {selectedTemplate ? `Tasks in "${selectedTemplate.name}"` : 'Task Preview'}
              </div>
              {!selectedTemplateId ? (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <CheckSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Select a template to preview its tasks
                  </p>
                </div>
              ) : loadingTasks ? (
                <div className="flex items-center justify-center py-8">
                  <CcdSpinner size="sm" />
                </div>
              ) : templateTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  This template has no tasks
                </p>
              ) : (
                <div className="divide-y">
                  {templateTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 px-3 py-2">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          PRIORITY_DOTS[task.priority] ?? 'bg-slate-400'
                        }`}
                      />
                      <span className="text-xs truncate flex-1">{task.title}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Project details */}
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label htmlFor="tmpl-name">Project Name</Label>
              <Input
                id="tmpl-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My New Project"
                required
              />
            </div>
            <div>
              <Label htmlFor="tmpl-desc">Description (optional)</Label>
              <textarea
                id="tmpl-desc"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe the project..."
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !selectedTemplateId}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
