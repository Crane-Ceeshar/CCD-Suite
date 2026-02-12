'use client';

import { useState } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ccd/ui';
import { Star, Plus, Search } from 'lucide-react';
import { usePerformanceReviews } from '@/hooks/use-hr';
import { ReviewDialog } from '@/components/hr/review-dialog';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  submitted: 'default',
  acknowledged: 'outline',
};

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-sm text-muted-foreground">Not rated</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export default function PerformanceReviewsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: response, isLoading } = usePerformanceReviews({
    status: statusFilter === 'all' ? '' : statusFilter,
    search,
    sort: 'review_date',
    dir: 'desc',
  });

  const reviews = (response?.data as Array<{
    id: string;
    review_period: string;
    review_date: string;
    rating: number | null;
    status: string;
    overall_comments: string | null;
    employee?: { id: string; first_name: string; last_name: string };
    reviewer?: { id: string; first_name: string; last_name: string };
  }>) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Performance Reviews"
          description="Track and manage employee performance evaluations"
        />
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Review
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Reviews Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first performance review to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {review.employee
                          ? `${review.employee.first_name} ${review.employee.last_name}`
                          : 'Unknown Employee'}
                      </h3>
                      <Badge variant={STATUS_VARIANTS[review.status] ?? 'secondary'}>
                        {review.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {review.review_period} &middot;{' '}
                      {new Date(review.review_date).toLocaleDateString()}
                    </p>
                    {review.reviewer && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed by {review.reviewer.first_name} {review.reviewer.last_name}
                      </p>
                    )}
                  </div>
                  <RatingStars rating={review.rating} />
                </div>
                {review.overall_comments && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {review.overall_comments}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReviewDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
