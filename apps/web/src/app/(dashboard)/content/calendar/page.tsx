'use client';

import * as React from 'react';
import { PageHeader, Button, CcdLoader } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { EditorialCalendar } from '@/components/content/editorial-calendar';

interface CalendarItem {
  id: string;
  title: string;
  content_type: string;
  status: string;
  publish_date: string;
  category: { id: string; name: string; color: string } | null;
}

export default function EditorialCalendarPage() {
  const router = useRouter();
  const [month, setMonth] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [items, setItems] = React.useState<CalendarItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch items for the visible month range (include overlap for multi-day display)
        const from = new Date(month.getFullYear(), month.getMonth(), 1);
        const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
        const res = await apiGet<CalendarItem[]>(
          `/api/content/calendar?from=${from.toISOString()}&to=${to.toISOString()}`
        );
        setItems(res.data ?? []);
      } catch {
        /* handled */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [month]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editorial Calendar"
        description="Plan and schedule content publication"
        breadcrumbs={[{ label: 'Content', href: '/content' }, { label: 'Calendar' }]}
        actions={
          <Button onClick={() => router.push('/content/editor')}>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <CcdLoader size="lg" />
        </div>
      ) : (
        <EditorialCalendar items={items} month={month} onMonthChange={setMonth} />
      )}
    </div>
  );
}
