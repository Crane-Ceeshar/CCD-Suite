'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormField,
  ModuleIcon,
  CcdLoader,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { Clock, AlertTriangle, Save } from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';
import type { ModuleId } from '@ccd/shared';

/* -------------------------------------------------------------------------- */
/*  Defaults & Config                                                          */
/* -------------------------------------------------------------------------- */

const retentionDefaults = {
  crm: 'forever',
  content: 'forever',
  analytics: '2y',
  projects: 'forever',
  finance: 'forever',
  hr: 'forever',
};

const retentionOptions = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '180d', label: '180 Days' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: 'forever', label: 'Forever (No Deletion)' },
];

const moduleRetentionInfo: { id: string; moduleId: ModuleId; description: string }[] = [
  { id: 'crm', moduleId: 'crm', description: 'Activities, notes, and communication logs' },
  { id: 'content', moduleId: 'content', description: 'Draft content, revisions, and archived posts' },
  { id: 'analytics', moduleId: 'analytics', description: 'Raw metrics, dashboard snapshots, and report data' },
  { id: 'projects', moduleId: 'projects', description: 'Archived tasks, completed sprints, and time entries' },
  { id: 'finance', moduleId: 'finance', description: 'Transaction logs, payment records, and receipts' },
  { id: 'hr', moduleId: 'hr', description: 'Attendance records, leave history, and payroll archives' },
];

/* -------------------------------------------------------------------------- */
/*  Module Names                                                               */
/* -------------------------------------------------------------------------- */

const moduleNames: Record<string, string> = {
  crm: 'CRM',
  content: 'Content',
  analytics: 'Analytics',
  projects: 'Projects',
  finance: 'Finance',
  hr: 'HR',
};

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function DataRetentionSettingsPage() {
  const { settings, updateField, loading, saving, save, isDirty } =
    useModuleSettings({
      module: 'platform',
      key: 'data_retention',
      defaults: retentionDefaults,
    });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Data Retention Policies</p>
            <p className="text-sm text-muted-foreground mt-1">
              Configure how long data is retained before automatic cleanup.
              Policies saved here will apply when automatic data retention is
              enabled in a future update.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Data Retention
          </CardTitle>
          <CardDescription>
            Set retention periods for each module to control how long data is
            kept before cleanup
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleRetentionInfo.map((mod) => (
          <Card key={mod.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ModuleIcon moduleId={mod.moduleId} size="sm" />
                {moduleNames[mod.id] ?? mod.id}
              </CardTitle>
              <CardDescription className="text-xs">
                {mod.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField label="Retention Period" htmlFor={`retention-${mod.id}`}>
                <Select
                  value={(settings as Record<string, string>)[mod.id] ?? 'forever'}
                  onValueChange={(v) =>
                    updateField(mod.id as keyof typeof retentionDefaults, v)
                  }
                >
                  <SelectTrigger id={`retention-${mod.id}`}>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {retentionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !isDirty}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Retention Policies
        </Button>
      </div>
    </div>
  );
}
