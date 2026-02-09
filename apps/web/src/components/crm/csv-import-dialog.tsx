'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  CcdSpinner,
  Badge,
} from '@ccd/ui';
import { Upload, CheckCircle2, FileJson, FileSpreadsheet } from 'lucide-react';
import { apiPost } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DataImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: 'contacts' | 'companies' | 'deals';
  onSuccess: () => void;
}

type FileFormat = 'csv' | 'json' | null;

/* -------------------------------------------------------------------------- */
/*  Parsers                                                                    */
/* -------------------------------------------------------------------------- */

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.toLowerCase()] = cells[idx] ?? '';
    });
    return row;
  });

  return { headers, rows };
}

function parseJsonText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parsed = JSON.parse(text);
  const arr: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length === 0) return { headers: [], rows: [] };

  const headers = Object.keys(arr[0]);
  const rows = arr.map((item) => {
    const row: Record<string, string> = {};
    for (const key of headers) {
      const val = item[key];
      row[key.toLowerCase()] = val === null || val === undefined ? '' : String(val);
    }
    return row;
  });

  return { headers, rows };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function DataImportDialog({ open, onOpenChange, entity, onSuccess }: DataImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [format, setFormat] = React.useState<FileFormat>(null);
  const [preview, setPreview] = React.useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [allRows, setAllRows] = React.useState<Record<string, string>[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{ imported: number; errors: number } | null>(null);

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setFormat(null);
      setPreview([]);
      setHeaders([]);
      setAllRows([]);
      setResult(null);
    }
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const detectedFormat: FileFormat = f.name.endsWith('.json') ? 'json' : 'csv';
    setFormat(detectedFormat);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const { headers: h, rows } =
          detectedFormat === 'json' ? parseJsonText(text) : parseCsvText(text);
        setHeaders(h);
        setAllRows(rows);
        setPreview(rows.slice(0, 5));
      } catch {
        setHeaders([]);
        setAllRows([]);
        setPreview([]);
      }
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file || headers.length === 0 || allRows.length === 0) return;
    setImporting(true);

    let imported = 0;
    let errors = 0;

    for (const row of allRows) {
      try {
        await apiPost(`/api/crm/${entity}`, row);
        imported++;
      } catch {
        errors++;
      }
    }

    setResult({ imported, errors });
    if (imported > 0) onSuccess();
    setImporting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {entity}</DialogTitle>
          <DialogDescription>Upload a CSV or JSON file to import {entity}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : 'Click to upload CSV or JSON file'}
            </span>
            <span className="text-xs text-muted-foreground/60">
              Supported formats: .csv, .json
            </span>
            <input
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Format badge */}
          {format && (
            <div className="flex items-center gap-2">
              {format === 'json' ? (
                <FileJson className="h-4 w-4 text-blue-500" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
              )}
              <Badge variant="secondary" className="text-xs">
                {format.toUpperCase()} format detected
              </Badge>
              <span className="text-xs text-muted-foreground">
                {allRows.length} record{allRows.length !== 1 ? 's' : ''} found
              </span>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Preview (first {preview.length} rows):
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {headers.map((h, i) => (
                      <th key={i} className="px-2 py-1 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b">
                      {headers.map((h, j) => (
                        <td key={j} className="px-2 py-1 truncate max-w-[120px]">
                          {row[h.toLowerCase()] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="flex items-center gap-2 rounded-md bg-muted p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>
                Imported {result.imported} records.
                {result.errors > 0 && ` ${result.errors} errors.`}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || allRows.length === 0 || importing}>
              {importing && <CcdSpinner size="sm" className="mr-2" />}
              Import {allRows.length > 0 ? `(${allRows.length})` : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Backward-compatible alias
 */
export const CsvImportDialog = DataImportDialog;

/**
 * Legacy CSV export — kept for backward compatibility.
 * Prefer `exportCrmData` from '@/lib/crm-export' for human-readable exports.
 */
export function exportToCsv(filename: string, data: Record<string, unknown>[]) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
