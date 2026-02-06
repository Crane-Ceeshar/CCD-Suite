import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Button } from '@ccd/ui';
import { PenTool, FileText, Calendar, Image as ImageIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import { AskAiButton } from '@/components/ai/ask-ai-button';

export default function ContentDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content"
        description="Content planning, creation, and scheduling"
        actions={<Button><Plus className="mr-2 h-4 w-4" />New Content</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Items" value="0" icon={<FileText className="h-5 w-5 text-muted-foreground" />} moduleColor="#EC4899" />
        <StatCard label="Published" value="0" icon={<PenTool className="h-5 w-5 text-muted-foreground" />} moduleColor="#EC4899" />
        <StatCard label="Scheduled" value="0" icon={<Calendar className="h-5 w-5 text-muted-foreground" />} moduleColor="#EC4899" />
        <StatCard label="In Review" value="0" icon={<ImageIcon className="h-5 w-5 text-muted-foreground" />} moduleColor="#EC4899" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/content/calendar">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader><CardTitle className="text-base">Editorial Calendar</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Plan and schedule content across channels</p></CardContent>
          </Card>
        </Link>
        <Link href="/content/library">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader><CardTitle className="text-base">Content Library</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Browse and manage all content pieces</p></CardContent>
          </Card>
        </Link>
        <Link href="/content/editor">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader><CardTitle className="text-base">Content Editor</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Create and edit content with the rich editor</p></CardContent>
          </Card>
        </Link>
      </div>

      <AskAiButton moduleContext="content" />
    </div>
  );
}
