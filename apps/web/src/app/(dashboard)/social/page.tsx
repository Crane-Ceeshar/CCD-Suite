import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { Share2, Calendar, TrendingUp, Eye } from 'lucide-react';
import Link from 'next/link';
import { AskAiButton } from '@/components/ai/ask-ai-button';

export default function SocialDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Media"
        description="Social account management and engagement"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Connected Accounts"
          value="0"
          trend="neutral"
          icon={<Share2 className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Scheduled Posts"
          value="0"
          trend="neutral"
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Engagement Rate"
          value="0%"
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Total Reach"
          value="0"
          trend="neutral"
          icon={<Eye className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/social/compose">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Compose</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and schedule posts across platforms
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/social/posts">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage all your social posts
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/social/campaigns">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organise posts into marketing campaigns
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/social/engagement">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor engagement and respond to comments
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <AskAiButton moduleContext="social" />
    </div>
  );
}
