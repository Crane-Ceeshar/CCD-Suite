'use client';

import * as React from 'react';
import { MODULES } from '@ccd/shared';
import {
  ModuleSettingsDialog,
  type ModuleSettingsTab,
  Button,
  Label,
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
  BarChart3,
  LayoutDashboard,
  Database,
  FileBarChart,
} from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

interface AnalyticsSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Dashboard Tab ---

interface DashboardSettings {
  defaultDateRange: string;
  defaultChartType: string;
  autoRefreshInterval: string;
  showComparisonData: boolean;
}

const dashboardDefaults: DashboardSettings = {
  defaultDateRange: '30d',
  defaultChartType: 'line',
  autoRefreshInterval: 'off',
  showComparisonData: true,
};

function DashboardTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<DashboardSettings>({
      module: 'analytics',
      key: 'dashboard.preferences',
      defaults: dashboardDefaults,
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
        <Label className="text-sm font-medium">Default Date Range</Label>
        <p className="text-xs text-muted-foreground">
          The default time period shown when opening dashboards.
        </p>
        <Select
          value={settings.defaultDateRange}
          onValueChange={(v) => updateField('defaultDateRange', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="ytd">Year to date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Chart Type</Label>
        <p className="text-xs text-muted-foreground">
          The chart type used by default for new visualizations.
        </p>
        <Select
          value={settings.defaultChartType}
          onValueChange={(v) => updateField('defaultChartType', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="area">Area</SelectItem>
            <SelectItem value="pie">Pie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Auto-Refresh Interval</Label>
        <p className="text-xs text-muted-foreground">
          How often dashboard data refreshes automatically.
        </p>
        <Select
          value={settings.autoRefreshInterval}
          onValueChange={(v) => updateField('autoRefreshInterval', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Off</SelectItem>
            <SelectItem value="30s">30 seconds</SelectItem>
            <SelectItem value="1m">1 minute</SelectItem>
            <SelectItem value="5m">5 minutes</SelectItem>
            <SelectItem value="15m">15 minutes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Show Comparison Data</Label>
          <p className="text-xs text-muted-foreground">
            Display previous period comparison alongside current data.
          </p>
        </div>
        <Switch
          checked={settings.showComparisonData}
          onCheckedChange={(v) => updateField('showComparisonData', v)}
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

// --- Data Sources Tab ---

interface DataSourcesSettings {
  enableGoogleAnalytics: boolean;
  enableSocialMetrics: boolean;
  dataRetentionPeriod: string;
}

const dataSourcesDefaults: DataSourcesSettings = {
  enableGoogleAnalytics: false,
  enableSocialMetrics: true,
  dataRetentionPeriod: '90d',
};

function DataSourcesTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<DataSourcesSettings>({
      module: 'analytics',
      key: 'data-sources.preferences',
      defaults: dataSourcesDefaults,
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
          <Label className="text-sm font-medium">Enable Google Analytics</Label>
          <p className="text-xs text-muted-foreground">
            Pull data from your connected Google Analytics account.
          </p>
        </div>
        <Switch
          checked={settings.enableGoogleAnalytics}
          onCheckedChange={(v) => updateField('enableGoogleAnalytics', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Social Metrics</Label>
          <p className="text-xs text-muted-foreground">
            Include social media engagement data in analytics.
          </p>
        </div>
        <Switch
          checked={settings.enableSocialMetrics}
          onCheckedChange={(v) => updateField('enableSocialMetrics', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Data Retention Period</Label>
        <p className="text-xs text-muted-foreground">
          How long historical data is kept before being archived.
        </p>
        <Select
          value={settings.dataRetentionPeriod}
          onValueChange={(v) => updateField('dataRetentionPeriod', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">30 days</SelectItem>
            <SelectItem value="90d">90 days</SelectItem>
            <SelectItem value="1y">1 year</SelectItem>
            <SelectItem value="unlimited">Unlimited</SelectItem>
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

// --- Reports Tab ---

interface ReportsSettings {
  defaultExportFormat: string;
  includeBranding: boolean;
  emailReportsAutomatically: boolean;
}

const reportsDefaults: ReportsSettings = {
  defaultExportFormat: 'pdf',
  includeBranding: true,
  emailReportsAutomatically: false,
};

function ReportsTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<ReportsSettings>({
      module: 'analytics',
      key: 'reports.preferences',
      defaults: reportsDefaults,
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
        <Label className="text-sm font-medium">Default Export Format</Label>
        <p className="text-xs text-muted-foreground">
          The file format used when exporting reports.
        </p>
        <Select
          value={settings.defaultExportFormat}
          onValueChange={(v) => updateField('defaultExportFormat', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Include Branding on Reports</Label>
          <p className="text-xs text-muted-foreground">
            Add your organization logo and colors to exported reports.
          </p>
        </div>
        <Switch
          checked={settings.includeBranding}
          onCheckedChange={(v) => updateField('includeBranding', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Email Reports Automatically</Label>
          <p className="text-xs text-muted-foreground">
            Send scheduled reports to team members via email.
          </p>
        </div>
        <Switch
          checked={settings.emailReportsAutomatically}
          onCheckedChange={(v) => updateField('emailReportsAutomatically', v)}
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

// --- Main Dialog ---

export function AnalyticsSettingsDialog({
  open,
  onOpenChange,
}: AnalyticsSettingsDialogProps) {
  const mod = MODULES['analytics'];

  const tabs: ModuleSettingsTab[] = [
    {
      value: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard />,
      content: <DashboardTabContent />,
    },
    {
      value: 'data-sources',
      label: 'Data Sources',
      icon: <Database />,
      content: <DataSourcesTabContent />,
    },
    {
      value: 'reports',
      label: 'Reports',
      icon: <FileBarChart />,
      content: <ReportsTabContent />,
    },
  ];

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${mod?.name || 'Analytics'} Settings`}
      description="Configure analytics preferences, data sources, and report defaults."
      tabs={tabs}
      moduleColor={mod?.color}
      icon={<BarChart3 />}
    />
  );
}
