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
} from '@ccd/ui';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { apiPost } from '@/lib/api';

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: 'contacts' | 'companies' | 'deals';
  onSuccess: () => void;
}

export function CsvImportDialog({ open, onOpenChange, entity, onSuccess }: CsvImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string[][]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{ imported: number; errors: number } | null>(null);

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setPreview([]);
      setHeaders([]);
      setResult(null);
    }
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length === 0) return;

      const csvHeaders = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      setHeaders(csvHeaders);

      const rows = lines.slice(1, 6).map((line) =>
        line.split(',').map((cell) => cell.trim().replace(/"/g, ''))
      );
      setPreview(rows);
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file || headers.length === 0) return;
    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      const csvHeaders = lines[0].split(',').map((h) => h.trim().replace(/"/g, '').toLowerCase());

      let imported = 0;
      let errors = 0;

      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        csvHeaders.forEach((h, idx) => {
          row[h] = cells[idx] ?? '';
        });

        try {
          await apiPost(`/api/crm/${entity}`, row);
          imported++;
        } catch {
          errors++;
        }
      }

      setResult({ imported, errors });
      if (imported > 0) onSuccess();
    } catch {
      setResult({ imported: 0, errors: 1 });
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import {entity}</DialogTitle>
          <DialogDescription>Upload a CSV file to import {entity}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          <label className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : 'Click to upload CSV file'}
            </span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </label>

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
                      <th key={i} className="px-2 py-1 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b">
                      {row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 truncate max-w-[120px]">{cell}</td>
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
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Export data as a CSV file download
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
