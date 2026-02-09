'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CcdLoader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ccd/ui';
import { TrendingUp } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { RankChart } from '@/components/seo/rank-chart';
import type { SeoKeyword, RankHistory } from '@ccd/shared/types/seo';

export default function RankTrackerPage() {
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>('');
  const [rankHistory, setRankHistory] = useState<{ date: string; rank: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    apiGet<SeoKeyword[]>('/api/seo/keywords?status=tracking')
      .then((res) => {
        setKeywords(res.data);
        if (res.data.length > 0) {
          setSelectedKeywordId(res.data[0].id);
        }
      })
      .catch(() => setKeywords([]))
      .finally(() => setLoading(false));
  }, []);

  const fetchHistory = useCallback(() => {
    if (!selectedKeywordId) return;
    setHistoryLoading(true);
    apiGet<RankHistory[]>(`/api/seo/rank-history?keyword_id=${selectedKeywordId}`)
      .then((res) => {
        setRankHistory(
          res.data.map((rh) => ({ date: rh.date, rank: rh.rank }))
        );
      })
      .catch(() => setRankHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [selectedKeywordId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const selectedKeyword = keywords.find((kw) => kw.id === selectedKeywordId);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Rank Tracker"
          description="Monitor your search engine rankings over time"
          breadcrumbs={[
            { label: 'SEO', href: '/seo' },
            { label: 'Rank Tracker' },
          ]}
        />
        <div className="flex items-center justify-center py-24">
          <CcdLoader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rank Tracker"
        description="Monitor your search engine rankings over time"
        breadcrumbs={[
          { label: 'SEO', href: '/seo' },
          { label: 'Rank Tracker' },
        ]}
      />

      {keywords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No keywords being tracked</h3>
            <p className="text-sm text-muted-foreground">
              Add keywords with &quot;tracking&quot; status to see rank history
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="w-72">
              <Select value={selectedKeywordId} onValueChange={setSelectedKeywordId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select keyword" />
                </SelectTrigger>
                <SelectContent>
                  {keywords.map((kw) => (
                    <SelectItem key={kw.id} value={kw.id}>
                      {kw.keyword}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedKeyword && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold" style={{ color: '#9BBD2B' }}>
                    {selectedKeyword.current_rank ?? '--'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Current Rank</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-muted-foreground">
                    {selectedKeyword.previous_rank ?? '--'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Previous Rank</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold">
                    {selectedKeyword.target_rank ?? '--'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Target Rank</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rank History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <CcdLoader size="md" />
                </div>
              ) : (
                <RankChart data={rankHistory} keyword={selectedKeyword?.keyword} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
