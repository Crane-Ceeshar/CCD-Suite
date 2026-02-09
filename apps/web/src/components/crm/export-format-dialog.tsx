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
import { FileJson, FileSpreadsheet, Download } from 'lucide-react';
import type { ExportFormat } from '@/lib/crm-export';

interface ExportFormatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: string;
  onExport: (format: ExportFormat) => void;
}

export function ExportFormatDialog({
  open,
  onOpenChange,
  entity,
  onExport,
}: ExportFormatDialogProps) {
  const [selected, setSelected] = React.useState<ExportFormat>('csv');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export {entity}</DialogTitle>
          <DialogDescription>
            Choose a format for exporting your {entity} data
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <button
            type="button"
            onClick={() => setSelected('csv')}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
              selected === 'csv'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <FileSpreadsheet
              className={`h-8 w-8 ${
                selected === 'csv' ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span className="text-sm font-medium">CSV</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              Spreadsheet compatible
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelected('json')}
            className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
              selected === 'json'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <FileJson
              className={`h-8 w-8 ${
                selected === 'json' ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span className="text-sm font-medium">JSON</span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight">
              Developer friendly
            </span>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onExport(selected);
              onOpenChange(false);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export as {selected.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
