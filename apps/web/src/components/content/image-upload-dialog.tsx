'use client';

import * as React from 'react';
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FormField,
  toast,
} from '@ccd/ui';
import { FileUpload } from '@/components/shared/file-upload';
import { ImagePlus } from 'lucide-react';

interface ImageUploadDialogProps {
  onInsert: (image: { src: string; alt: string }) => void;
  trigger?: React.ReactNode;
}

export function ImageUploadDialog({ onInsert, trigger }: ImageUploadDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState('upload');
  const [url, setUrl] = React.useState('');
  const [alt, setAlt] = React.useState('');
  const [uploadedUrl, setUploadedUrl] = React.useState('');

  function reset() {
    setUrl('');
    setAlt('');
    setUploadedUrl('');
    setTab('upload');
  }

  function handleInsertFromUpload() {
    if (!uploadedUrl) {
      toast({ title: 'No image', description: 'Please upload an image first', variant: 'destructive' });
      return;
    }
    onInsert({ src: uploadedUrl, alt: alt || 'Image' });
    setOpen(false);
    reset();
  }

  function handleInsertFromUrl() {
    if (!url) {
      toast({ title: 'No URL', description: 'Please enter an image URL', variant: 'destructive' });
      return;
    }
    onInsert({ src: url, alt: alt || 'Image' });
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <ImagePlus className="mr-2 h-4 w-4" />
            Insert Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <FileUpload
              bucket="content-images"
              accept="image/*"
              maxSize={10 * 1024 * 1024}
              onUploadComplete={(file) => {
                setUploadedUrl(file.url);
                toast({ title: 'Uploaded', description: file.name });
              }}
              onError={(err) => {
                toast({ title: 'Upload Error', description: err, variant: 'destructive' });
              }}
            />
            {uploadedUrl && (
              <p className="text-xs text-muted-foreground truncate">
                Uploaded: {uploadedUrl}
              </p>
            )}
            <FormField label="Alt Text">
              <Input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the image..."
              />
            </FormField>
            <DialogFooter>
              <Button onClick={handleInsertFromUpload} disabled={!uploadedUrl}>
                Insert Image
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-4">
            <FormField label="Image URL">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                type="url"
              />
            </FormField>
            <FormField label="Alt Text">
              <Input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Describe the image..."
              />
            </FormField>
            <DialogFooter>
              <Button onClick={handleInsertFromUrl} disabled={!url}>
                Insert Image
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
