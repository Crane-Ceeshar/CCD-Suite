export type Period = '7d' | '30d' | '90d' | 'ytd';

export interface TimeBucket {
  label: string;
  start: string;
  end: string;
}

/** Calculate the ISO date string for the start of a given period */
export function getPeriodStart(period: string): string {
  const now = new Date();
  switch (period) {
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '90d':
      now.setDate(now.getDate() - 90);
      break;
    case 'ytd':
      now.setMonth(0, 1);
      now.setHours(0, 0, 0, 0);
      break;
    default:
      now.setDate(now.getDate() - 30);
  }
  return now.toISOString();
}

export function getTimeBuckets(period: string): TimeBucket[] {
  const now = new Date();
  const buckets: TimeBucket[] = [];

  if (period === '7d') {
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const end = new Date(day);
      end.setHours(23, 59, 59, 999);
      buckets.push({
        label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        start: day.toISOString(),
        end: end.toISOString(),
      });
    }
  } else if (period === '30d') {
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      buckets.push({
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      });
    }
  } else {
    const monthCount = period === '90d' ? 3 : now.getMonth() + 1;
    for (let i = monthCount - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      buckets.push({
        label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
      });
    }
  }

  return buckets;
}

export function findBucketIndex<T extends { start: string; end: string }>(
  buckets: T[],
  dateStr: string | null
): number {
  if (!dateStr) return -1;
  const ts = new Date(dateStr).getTime();
  for (let i = 0; i < buckets.length; i++) {
    if (ts >= new Date(buckets[i].start).getTime() && ts <= new Date(buckets[i].end).getTime()) {
      return i;
    }
  }
  return -1;
}
