'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  CcdLoader,
} from '@ccd/ui';
import {
  Database,
  Upload,
  Trash2,
  Search,
  FileText,
  File,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  HardDrive,
  X,
} from 'lucide-react';
import {
  useKnowledgeBase,
  useUploadDocument,
  useDeleteDocument,
  useSearchKnowledgeBase,
} from '@/hooks/use-ai-knowledge-base';
import type { AiKnowledgeBaseDoc } from '@ccd/shared';

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    icon: Loader2,
  },
  ready: {
    label: 'Ready',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    icon: XCircle,
  },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFileIcon(fileType: string): React.ElementType {
  if (fileType.includes('markdown') || fileType.includes('md')) return FileText;
  if (fileType.includes('pdf')) return File;
  return FileText;
}

export default function KnowledgeBasePage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const { documents, isLoading, error, reload, setDocuments } = useKnowledgeBase(
    statusFilter !== 'all' ? statusFilter : undefined
  );

  const { upload, isUploading, error: uploadError, reset: resetUpload } = useUploadDocument();
  const { remove, isDeleting } = useDeleteDocument();
  const { search, isSearching, results, error: searchError, reset: resetSearch } = useSearchKnowledgeBase();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = React.useState('');

  // Handle file upload
  async function handleUpload() {
    if (!selectedFile || !title.trim()) return;

    const result = await upload(selectedFile, title, description);
    if (result) {
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      reload();
    }
  }

  // Handle document delete
  async function handleDelete(doc: AiKnowledgeBaseDoc) {
    const ok = await remove(doc.id);
    if (ok) {
      setDocuments(documents.filter((d) => d.id !== doc.id));
    }
  }

  // Handle search
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    await search(searchQuery);
  }

  // Handle file selection
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title.trim()) {
        // Auto-fill title from file name
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(name);
      }
    }
  }

  const STATUS_TABS = [
    { id: 'all', label: 'All' },
    { id: 'ready', label: 'Ready' },
    { id: 'processing', label: 'Processing' },
    { id: 'pending', label: 'Pending' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base"
        description="Upload documents to enhance AI responses with your organization's knowledge"
        breadcrumbs={[
          { label: 'AI', href: '/ai' },
          { label: 'Knowledge Base' },
        ]}
      />

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                placeholder="Document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <input
                type="text"
                placeholder="Brief description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">File</label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx"
                onChange={handleFileSelect}
                className="flex-1 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700 dark:file:bg-emerald-950 dark:file:text-emerald-300 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900 cursor-pointer"
              />
              {selectedFile && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatFileSize(selectedFile.size)}
                </span>
              )}
            </div>
          </div>

          {uploadError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-center justify-between">
              <span>{uploadError}</span>
              <button onClick={resetUpload} className="ml-2">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !title.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Process
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="py-4 text-center text-sm text-red-700 dark:text-red-300">
            {error}
            <Button variant="ghost" size="sm" onClick={reload} className="ml-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {statusFilter !== 'all'
                ? 'No documents match the selected status filter.'
                : 'Upload documents to build your knowledge base. AI responses will be enhanced with context from your uploaded documents.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {!isLoading && !error && documents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const statusCfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const FileIcon = getFileIcon(doc.file_type);

            return (
              <Card
                key={doc.id}
                className="transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <CardTitle className="text-sm font-semibold line-clamp-1">
                        {doc.title}
                      </CardTitle>
                    </div>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={isDeleting === doc.id}
                      className="shrink-0 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete document"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {doc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`text-[10px] ${statusCfg.color}`}>
                      <StatusIcon className={`mr-1 h-3 w-3 ${doc.status === 'processing' ? 'animate-spin' : ''}`} />
                      {statusCfg.label}
                    </Badge>

                    <span className="text-[10px] text-muted-foreground">
                      {doc.file_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(doc.file_size)}
                    </span>
                    {doc.chunk_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {doc.chunk_count} chunks
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Search Test Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Search Knowledge Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Try a vector search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    resetSearch();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>

          {searchError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {searchError}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Found {results.length} matching chunk{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result, idx) => (
                <div
                  key={result.id}
                  className="rounded-lg border bg-muted/30 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Match #{idx + 1}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {(result.similarity * 100).toFixed(1)}% similarity
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-5">
                    {result.content}
                  </p>
                  {(result.metadata as Record<string, unknown>)?.file_name ? (
                    <p className="text-[10px] text-muted-foreground">
                      Source: {String((result.metadata as Record<string, unknown>).file_name)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {!isSearching && results.length === 0 && searchQuery && !searchError && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No results found. Try a different query or lower the similarity threshold.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
