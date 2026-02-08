'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  ConfirmationDialog,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { Download, Upload, FileJson } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function DataManagementPage() {
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [parsedData, setParsedData] = React.useState<Record<string, unknown> | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* ---------------------------------------------------------------------- */
  /*  Export                                                                */
  /* ---------------------------------------------------------------------- */

  async function handleExport() {
    setExporting(true);
    try {
      const res = await apiGet<Record<string, unknown>>('/api/settings/export');

      const json = JSON.stringify(res.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ccd-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export complete',
        description: 'Settings exported successfully.',
      });
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Could not export settings.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Import — file selection                                               */
  /* ---------------------------------------------------------------------- */

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setParsedData(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        setParsedData(data);
      } catch {
        setParseError('Invalid JSON file. Please select a valid settings export file.');
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);

    // Reset file input so same file can be selected again
    e.target.value = '';
  }

  /* ---------------------------------------------------------------------- */
  /*  Import — submit                                                       */
  /* ---------------------------------------------------------------------- */

  async function handleImport() {
    if (!parsedData) return;

    setImporting(true);
    try {
      await apiPost('/api/settings/import', {
        settings: parsedData.settings || parsedData,
      });
      toast({
        title: 'Import complete',
        description: 'Settings imported successfully.',
      });
      // Reset state
      setSelectedFile(null);
      setParsedData(null);
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Could not import settings.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  }

  function clearImport() {
    setSelectedFile(null);
    setParsedData(null);
    setParseError(null);
  }

  /* ---------------------------------------------------------------------- */
  /*  Count settings keys                                                   */
  /* ---------------------------------------------------------------------- */

  function countSettingsKeys(data: Record<string, unknown>): number {
    const settings = (data.settings || data) as Record<string, unknown>;
    return Object.keys(settings).length;
  }

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileJson className="h-5 w-5 text-primary" />
          Data Management
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Export and import your organization settings for backup or migration
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5 text-primary" />
              Export Settings
            </CardTitle>
            <CardDescription>
              Download all your organization&apos;s settings as a JSON file for
              backup or migration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <CcdSpinner size="sm" className="mr-2" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {exporting ? 'Exporting...' : 'Export Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-5 w-5 text-primary" />
              Import Settings
            </CardTitle>
            <CardDescription>
              Restore settings from a previously exported JSON file. This will
              overwrite matching settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden file input */}
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />

            {!selectedFile && !parseError && (
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select File
              </Button>
            )}

            {/* Parse error */}
            {parseError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">{parseError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    clearImport();
                    fileInputRef.current?.click();
                  }}
                >
                  Try Another File
                </Button>
              </div>
            )}

            {/* File preview */}
            {selectedFile && parsedData && (
              <div className="space-y-3">
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileJson className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {countSettingsKeys(parsedData)} settings key
                    {countSettingsKeys(parsedData) !== 1 ? 's' : ''} found
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <ConfirmationDialog
                    trigger={
                      <Button disabled={importing}>
                        {importing ? (
                          <CcdSpinner size="sm" className="mr-2" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {importing ? 'Importing...' : 'Import'}
                      </Button>
                    }
                    title="Import Settings"
                    description="This will overwrite existing settings with matching keys. This action cannot be undone. Are you sure you want to proceed?"
                    confirmLabel="Import Settings"
                    variant="destructive"
                    onConfirm={handleImport}
                  />
                  <Button variant="ghost" size="sm" onClick={clearImport}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
