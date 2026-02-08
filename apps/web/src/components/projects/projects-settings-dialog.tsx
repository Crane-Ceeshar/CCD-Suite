'use client';

import * as React from 'react';
import { MODULES } from '@ccd/shared';
import {
  ModuleSettingsDialog,
  type ModuleSettingsTab,
  Button,
  Label,
  Input,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
  CcdLoader,
} from '@ccd/ui';
import {
  Save,
  FolderKanban,
  CheckSquare,
  GitBranch,
  Clock,
} from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

interface ProjectsSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Tasks Tab ---

interface TasksSettings {
  defaultPriority: string;
  autoAssignToCreator: boolean;
  dueDateRequired: boolean;
  defaultTaskView: string;
}

const tasksDefaults: TasksSettings = {
  defaultPriority: 'medium',
  autoAssignToCreator: true,
  dueDateRequired: false,
  defaultTaskView: 'board',
};

function TasksTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<TasksSettings>({
      module: 'projects',
      key: 'tasks.preferences',
      defaults: tasksDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Priority</Label>
        <p className="text-xs text-muted-foreground">
          The priority level assigned to new tasks.
        </p>
        <Select
          value={settings.defaultPriority}
          onValueChange={(v) => updateField('defaultPriority', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Auto-Assign to Creator</Label>
          <p className="text-xs text-muted-foreground">
            Automatically assign new tasks to the person who created them.
          </p>
        </div>
        <Switch
          checked={settings.autoAssignToCreator}
          onCheckedChange={(v) => updateField('autoAssignToCreator', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Due Date Required</Label>
          <p className="text-xs text-muted-foreground">
            Require a due date when creating tasks.
          </p>
        </div>
        <Switch
          checked={settings.dueDateRequired}
          onCheckedChange={(v) => updateField('dueDateRequired', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Task View</Label>
        <p className="text-xs text-muted-foreground">
          The view shown when opening the tasks section.
        </p>
        <Select
          value={settings.defaultTaskView}
          onValueChange={(v) => updateField('defaultTaskView', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="board">Board</SelectItem>
            <SelectItem value="list">List</SelectItem>
            <SelectItem value="timeline">Timeline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Workflow Tab ---

interface WorkflowSettings {
  enableWipLimits: boolean;
  wipLimitPerColumn: string;
  autoArchiveCompletedDays: string;
  enableSprints: boolean;
}

const workflowDefaults: WorkflowSettings = {
  enableWipLimits: false,
  wipLimitPerColumn: '5',
  autoArchiveCompletedDays: '30',
  enableSprints: false,
};

function WorkflowTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<WorkflowSettings>({
      module: 'projects',
      key: 'workflow.preferences',
      defaults: workflowDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable WIP Limits</Label>
          <p className="text-xs text-muted-foreground">
            Limit the number of tasks in progress per board column.
          </p>
        </div>
        <Switch
          checked={settings.enableWipLimits}
          onCheckedChange={(v) => updateField('enableWipLimits', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">WIP Limit Per Column</Label>
        <p className="text-xs text-muted-foreground">
          Maximum number of tasks allowed in each column.
        </p>
        <Input
          type="number"
          value={settings.wipLimitPerColumn}
          onChange={(e) => updateField('wipLimitPerColumn', e.target.value)}
          placeholder="5"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Auto-Archive Completed After Days</Label>
        <p className="text-xs text-muted-foreground">
          Automatically archive tasks this many days after completion.
        </p>
        <Input
          type="number"
          value={settings.autoArchiveCompletedDays}
          onChange={(e) => updateField('autoArchiveCompletedDays', e.target.value)}
          placeholder="30"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Sprints</Label>
          <p className="text-xs text-muted-foreground">
            Organize work into time-boxed sprint iterations.
          </p>
        </div>
        <Switch
          checked={settings.enableSprints}
          onCheckedChange={(v) => updateField('enableSprints', v)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Time Tracking Tab ---

interface TimeTrackingSettings {
  enableTimeTracking: boolean;
  requireTimeEntries: boolean;
  billableByDefault: boolean;
  roundingIncrement: string;
}

const timeTrackingDefaults: TimeTrackingSettings = {
  enableTimeTracking: true,
  requireTimeEntries: false,
  billableByDefault: true,
  roundingIncrement: '15m',
};

function TimeTrackingTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<TimeTrackingSettings>({
      module: 'projects',
      key: 'time-tracking.preferences',
      defaults: timeTrackingDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Time Tracking</Label>
          <p className="text-xs text-muted-foreground">
            Allow team members to log time against tasks.
          </p>
        </div>
        <Switch
          checked={settings.enableTimeTracking}
          onCheckedChange={(v) => updateField('enableTimeTracking', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Require Time Entries</Label>
          <p className="text-xs text-muted-foreground">
            Require a time entry before marking tasks as complete.
          </p>
        </div>
        <Switch
          checked={settings.requireTimeEntries}
          onCheckedChange={(v) => updateField('requireTimeEntries', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Billable by Default</Label>
          <p className="text-xs text-muted-foreground">
            New time entries are marked as billable by default.
          </p>
        </div>
        <Switch
          checked={settings.billableByDefault}
          onCheckedChange={(v) => updateField('billableByDefault', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Rounding Increment</Label>
        <p className="text-xs text-muted-foreground">
          Time entries are rounded to the nearest increment.
        </p>
        <Select
          value={settings.roundingIncrement}
          onValueChange={(v) => updateField('roundingIncrement', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">1 minute</SelectItem>
            <SelectItem value="5m">5 minutes</SelectItem>
            <SelectItem value="15m">15 minutes</SelectItem>
            <SelectItem value="30m">30 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Main Dialog ---

export function ProjectsSettingsDialog({
  open,
  onOpenChange,
}: ProjectsSettingsDialogProps) {
  const mod = MODULES['projects'];

  const tabs: ModuleSettingsTab[] = [
    {
      value: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare />,
      content: <TasksTabContent />,
    },
    {
      value: 'workflow',
      label: 'Workflow',
      icon: <GitBranch />,
      content: <WorkflowTabContent />,
    },
    {
      value: 'time-tracking',
      label: 'Time Tracking',
      icon: <Clock />,
      content: <TimeTrackingTabContent />,
    },
  ];

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${mod?.name || 'Projects'} Settings`}
      description="Configure task defaults, workflow rules, and time tracking preferences."
      tabs={tabs}
      moduleColor={mod?.color}
      icon={<FolderKanban />}
    />
  );
}
