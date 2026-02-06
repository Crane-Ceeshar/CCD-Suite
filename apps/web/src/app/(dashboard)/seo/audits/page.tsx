'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge } from '@ccd/ui';
import { Shield } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  running: { label: 'Running', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function SEOAuditsPage() {
  const [audits] = useState<any[]>([]);

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Audits"
        description="View audit results and site health scores"
      />

      {audits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No audits yet</h3>
            <p className="text-sm text-muted-foreground">
              Run an audit from your SEO project to check site health
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => {
            const config = statusConfig[audit.status];
            return (
              <Card key={audit.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    {audit.score !== null && (
                      <div className={`text-3xl font-bold ${getScoreColor(audit.score)}`}>
                        {audit.score}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        Audit {new Date(audit.started_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {audit.pages_crawled} pages crawled · {audit.issues_count} issues found
                      </p>
                    </div>
                  </div>
                  <Badge variant={config?.variant}>{config?.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
