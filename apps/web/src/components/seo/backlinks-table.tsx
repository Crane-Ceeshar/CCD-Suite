'use client';

import { Badge, Button, CcdLoader } from '@ccd/ui';
import { Trash2 } from 'lucide-react';
import type { Backlink } from '@ccd/shared/types/seo';

interface BacklinksTableProps {
  backlinks: Backlink[];
  loading: boolean;
  onDelete: (id: string) => void;
}

function getStatusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  if (status === 'lost') return 'destructive';
  if (status === 'pending') return 'secondary';
  return 'default';
}

function truncateUrl(url: string, max = 40) {
  if (url.length <= max) return url;
  return url.slice(0, max) + '...';
}

export function BacklinksTable({ backlinks, loading, onDelete }: BacklinksTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdLoader size="md" />
      </div>
    );
  }

  if (backlinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No backlinks found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Source URL</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Target URL</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Anchor Text</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">DA</th>
            <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Discovered</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {backlinks.map((bl) => (
            <tr key={bl.id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="p-4">
                <span className="text-sm" title={bl.source_url}>
                  {truncateUrl(bl.source_url)}
                </span>
              </td>
              <td className="p-4">
                <span className="text-sm" title={bl.target_url}>
                  {truncateUrl(bl.target_url)}
                </span>
              </td>
              <td className="p-4 text-sm">{bl.anchor_text ?? '--'}</td>
              <td className="p-4 text-right font-mono text-sm">{bl.domain_authority ?? '--'}</td>
              <td className="p-4 text-center">
                <Badge variant={getStatusVariant(bl.status)}>{bl.status}</Badge>
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {new Date(bl.discovered_at).toLocaleDateString()}
              </td>
              <td className="p-4 text-right">
                <Button variant="ghost" size="sm" onClick={() => onDelete(bl.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
