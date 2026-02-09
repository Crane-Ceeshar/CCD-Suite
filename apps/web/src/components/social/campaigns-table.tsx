'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, CcdLoader } from '@ccd/ui';
import { Pencil, Trash2, Megaphone } from 'lucide-react';
import { apiDelete } from '@/lib/api';
import type { SocialCampaign } from '@ccd/shared/types/social';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'outline' },
  completed: { label: 'Completed', variant: 'secondary' },
};

interface CampaignsTableProps {
  campaigns: SocialCampaign[];
  loading: boolean;
  onEdit: (campaign: SocialCampaign) => void;
  onRefresh: () => void;
}

export function CampaignsTable({ campaigns, loading, onEdit, onRefresh }: CampaignsTableProps) {
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await apiDelete(`/api/social/campaigns/${id}`);
      onRefresh();
    } catch {
      alert('Failed to delete campaign');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdLoader size="md" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground">
            Create a campaign to group related social posts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const config = statusConfig[campaign.status];
        return (
          <Card key={campaign.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base line-clamp-1">{campaign.name}</CardTitle>
              <Badge variant={config?.variant}>{config?.label}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {campaign.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {campaign.start_date && campaign.end_date && (
                  <span>
                    {new Date(campaign.start_date).toLocaleDateString()} &ndash;{' '}
                    {new Date(campaign.end_date).toLocaleDateString()}
                  </span>
                )}
                {campaign.budget != null && (
                  <span>
                    Budget:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(campaign.budget)}
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => onEdit(campaign)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(campaign.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
