'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@ccd/ui';
import { Plus, Megaphone } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'outline' },
  completed: { label: 'Completed', variant: 'secondary' },
};

export default function CampaignsPage() {
  const [campaigns] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Organise posts into marketing campaigns"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </PageHeader>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a campaign to group related social posts
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const config = statusConfig[campaign.status];
            return (
              <Card key={campaign.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-base">{campaign.name}</CardTitle>
                  <Badge variant={config?.variant}>{config?.label}</Badge>
                </CardHeader>
                <CardContent>
                  {campaign.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {campaign.start_date && campaign.end_date && (
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString()} – {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                    )}
                    {campaign.budget && (
                      <span>
                        Budget: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(campaign.budget)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
