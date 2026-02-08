'use client';

import * as React from 'react';
import { Upload, X, FileIcon } from 'lucide-react';
import { cn } from '@ccd/ui/lib/utils';
import { Button, CcdSpinner } from '@ccd/ui';

export interface FileUploadProps {
  bucket: string;
  accept?: string;
  maxSize?: number;
  onUploadComplete?: (file: { path: string; url: string; name: string; size: number }) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function FileUpload({
  bucket,
  accept,
  maxSize,
  onUploadComplete,
  onError,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (maxSize && file.size > maxSize) {
      onError?.(`File exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      // Get signed upload URL from API
      const response = await fetch('/api/uploads/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        onError?.(result.error?.message || 'Failed to get upload URL');
        return;
      }

      // Upload file to signed URL
      const uploadResponse = await fetch(result.data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        onError?.('Upload failed');
        return;
      }

      onUploadComplete?.({
        path: result.data.path,
        url: result.data.signedUrl.split('?')[0],
        name: file.name,
        size: file.size,
      });
    } catch {
      onError?.('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <CcdSpinner size="lg" className="text-primary" />
          <p className="text-sm text-muted-foreground">Uploading {fileName}...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Drop files here or{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => inputRef.current?.click()}
              >
                browse
              </button>
            </p>
            {maxSize && (
              <p className="mt-1 text-xs text-muted-foreground">
                Max file size: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
