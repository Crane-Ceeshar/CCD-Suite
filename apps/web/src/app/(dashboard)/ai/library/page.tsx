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
  BookOpen,
  Search,
  Star,
  Copy,
  Check,
  Trash2,
  X,
  PenTool,
  Share2,
  Megaphone,
  Mail,
  FileText,
  Sparkles,
  Tag,
  Clock,
} from 'lucide-react';
import {
  useAiLibrary,
  useToggleFavorite,
  useDeleteLibraryItem,
} from '@/hooks/use-ai-library';
import type { AiContentLibraryItem } from '@ccd/shared';

const CONTENT_TYPE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'blog_post', label: 'Blog Post' },
  { id: 'social_caption', label: 'Social Caption' },
  { id: 'ad_copy', label: 'Ad Copy' },
  { id: 'email_draft', label: 'Email Draft' },
  { id: 'seo_description', label: 'SEO Description' },
  { id: 'summary', label: 'Summary' },
  { id: 'custom', label: 'Custom' },
] as const;

const TYPE_ICONS: Record<string, React.ElementType> = {
  blog_post: PenTool,
  social_caption: Share2,
  ad_copy: Megaphone,
  email_draft: Mail,
  seo_description: Search,
  summary: FileText,
  custom: Sparkles,
};

const TYPE_COLORS: Record<string, string> = {
  blog_post: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  social_caption: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  ad_copy: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  email_draft: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  seo_description: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  summary: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  custom: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

function formatTypeName(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ContentLibraryPage() {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [showFavorites, setShowFavorites] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<AiContentLibraryItem | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { items, total, totalPages, isLoading, error, reload, setItems } = useAiLibrary({
    search: debouncedSearch || undefined,
    type: selectedType !== 'all' ? selectedType : undefined,
    favorites: showFavorites || undefined,
    page,
  });

  const { toggle, isToggling } = useToggleFavorite();
  const { remove, isDeleting } = useDeleteLibraryItem();

  async function handleToggleFavorite(item: AiContentLibraryItem) {
    const result = await toggle(item.id, !item.is_favorite);
    if (result) {
      setItems(items.map((i) => (i.id === item.id ? { ...i, is_favorite: result.is_favorite } : i)));
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...selectedItem, is_favorite: result.is_favorite });
      }
    }
  }

  async function handleDelete(id: string) {
    const ok = await remove(id);
    if (ok) {
      setItems(items.filter((i) => i.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  }

  function handleCopy(content: string) {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTypeChange(type: string) {
    setSelectedType(type);
    setPage(1);
  }

  function handleFavoritesToggle() {
    setShowFavorites(!showFavorites);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Library"
        description="Browse, search, and manage your AI-generated content"
        breadcrumbs={[
          { label: 'AI', href: '/ai' },
          { label: 'Library' },
        ]}
      />

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search content by title or text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Favorites Toggle */}
          <Button
            variant={showFavorites ? 'default' : 'outline'}
            size="sm"
            onClick={handleFavoritesToggle}
            className={showFavorites ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
          >
            <Star className={`mr-1.5 h-4 w-4 ${showFavorites ? 'fill-current' : ''}`} />
            Favourites
          </Button>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {CONTENT_TYPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTypeChange(tab.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedType === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
      {!isLoading && !error && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No content yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {debouncedSearch || selectedType !== 'all' || showFavorites
                ? 'No content matches your current filters. Try adjusting your search or filters.'
                : 'Content you generate and save will appear here. Head to the Content Generator to get started.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const TypeIcon = TYPE_ICONS[item.type] ?? Sparkles;
              return (
                <Card
                  key={item.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800"
                  onClick={() => setSelectedItem(item)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold line-clamp-1">
                        {item.title}
                      </CardTitle>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item);
                        }}
                        disabled={isToggling === item.id}
                        className="shrink-0 text-muted-foreground hover:text-amber-500 transition-colors disabled:opacity-50"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            item.is_favorite ? 'fill-amber-400 text-amber-400' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {item.content}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${TYPE_COLORS[item.type] ?? TYPE_COLORS.custom}`}
                      >
                        <TypeIcon className="mr-1 h-3 w-3" />
                        {formatTypeName(item.type)}
                      </Badge>

                      {item.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          <Tag className="mr-0.5 h-2.5 w-2.5" />
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} items)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog / Expanded View */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-auto rounded-xl border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b bg-card px-6 py-4">
              <h2 className="text-lg font-semibold line-clamp-1">{selectedItem.title}</h2>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleFavorite(selectedItem)}
                  disabled={isToggling === selectedItem.id}
                  className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  title={selectedItem.is_favorite ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Star
                    className={`h-4 w-4 ${
                      selectedItem.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleCopy(selectedItem.content)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="Copy content"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  disabled={isDeleting === selectedItem.id}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="Close"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Meta info */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={TYPE_COLORS[selectedItem.type] ?? TYPE_COLORS.custom}
                >
                  {formatTypeName(selectedItem.type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(selectedItem.created_at).toLocaleString()}
                </span>
                {selectedItem.model && (
                  <span className="text-xs text-muted-foreground">
                    Model: {selectedItem.model}
                  </span>
                )}
                {selectedItem.tokens_used != null && (
                  <span className="text-xs text-muted-foreground">
                    Tokens: {selectedItem.tokens_used.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Tags */}
              {selectedItem.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedItem.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Prompt */}
              {selectedItem.prompt && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Prompt</p>
                  <p className="text-sm">{selectedItem.prompt}</p>
                </div>
              )}

              {/* Content */}
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedItem.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
