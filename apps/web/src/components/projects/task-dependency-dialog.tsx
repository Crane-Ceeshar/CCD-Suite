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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
} from '@ccd/ui';
import { Search, Check } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SearchTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export interface TaskDependencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  taskId: string;
  onSuccess: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CLASSES: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const DEPENDENCY_TYPES: Array<{ value: string; label: string; description: string }> = [
  { value: 'blocks', label: 'Blocks', description: 'This task blocks the selected task' },
  { value: 'blocked_by', label: 'Blocked By', description: 'This task is blocked by the selected task' },
  { value: 'relates_to', label: 'Relates To', description: 'These tasks are related' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TaskDependencyDialog({
  open,
  onOpenChange,
  projectId,
  taskId,
  onSuccess,
}: TaskDependencyDialogProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchTask[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [dependencyType, setDependencyType] = React.useState('blocks');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedTaskId(null);
      setDependencyType('blocks');
      setError('');
    }
  }, [open]);

  // Debounced search
  React.useEffect(() => {
    if (!open) return;

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiGet<SearchTask[]>(
          `/api/projects/${projectId}/tasks?search=${encodeURIComponent(searchQuery.trim())}&limit=20`,
        );
        // Filter out the current task from results
        setSearchResults(res.data.filter((t) => t.id !== taskId));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, open, projectId, taskId]);

  async function handleSubmit() {
    if (!selectedTaskId) {
      setError('Please select a task');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiPost(`/api/projects/${projectId}/tasks/${taskId}/dependencies`, {
        depends_on_task_id: selectedTaskId,
        dependency_type: dependencyType,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dependency');
    } finally {
      setSaving(false);
    }
  }

  const selectedTask = searchResults.find((t) => t.id === selectedTaskId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Task Dependency</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dependency Type */}
          <div>
            <Label htmlFor="dep-type">Dependency Type</Label>
            <Select value={dependencyType} onValueChange={setDependencyType}>
              <SelectTrigger id="dep-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPENDENCY_TYPES.map((dt) => (
                  <SelectItem key={dt.value} value={dt.value}>
                    {dt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {DEPENDENCY_TYPES.find((dt) => dt.value === dependencyType)?.description}
            </p>
          </div>

          {/* Task Search */}
          <div>
            <Label htmlFor="dep-search">Search Tasks</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="dep-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by task title..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Selected task indicator */}
          {selectedTask && (
            <div className="flex items-center gap-2 rounded-md border border-primary/50 bg-primary/5 px-3 py-2 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate font-medium">{selectedTask.title}</span>
              <Badge className={`shrink-0 text-[10px] ${STATUS_CLASSES[selectedTask.status] ?? ''}`}>
                {STATUS_LABELS[selectedTask.status] ?? selectedTask.status}
              </Badge>
            </div>
          )}

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center py-4">
                  <CcdSpinner size="sm" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No tasks found matching your search
                </p>
              ) : (
                <div className="divide-y">
                  {searchResults.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${
                        selectedTaskId === task.id ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <span className="truncate">{task.title}</span>
                      <Badge className={`shrink-0 text-[10px] ${STATUS_CLASSES[task.status] ?? ''}`}>
                        {STATUS_LABELS[task.status] ?? task.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !selectedTaskId}>
            {saving && <CcdSpinner size="sm" className="mr-2" />}
            Add Dependency
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
