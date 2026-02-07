import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  try {
    // Get all deals with stage info
    const { data: deals } = await supabase
      .from('deals')
      .select('*, stage:pipeline_stages(id, name, color, position)')
      .order('created_at', { ascending: false });

    const allDeals = deals ?? [];

    // Win/loss stats
    const wonDeals = allDeals.filter((d: { status: string }) => d.status === 'won');
    const lostDeals = allDeals.filter((d: { status: string }) => d.status === 'lost');
    const openDeals = allDeals.filter((d: { status: string }) => d.status === 'open');
    const totalClosed = wonDeals.length + lostDeals.length;
    const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;

    // Average deal size (won deals)
    const avgDealSize =
      wonDeals.length > 0
        ? Math.round(
            wonDeals.reduce((sum: number, d: { value: number }) => sum + (d.value ?? 0), 0) /
              wonDeals.length
          )
        : 0;

    // Pipeline value (open deals)
    const pipelineValue = openDeals.reduce(
      (sum: number, d: { value: number }) => sum + (d.value ?? 0),
      0
    );

    // Average cycle time (won deals with actual_close_date)
    const cycleTimeDays: number[] = wonDeals
      .filter((d: { actual_close_date: string | null; created_at: string }) => d.actual_close_date)
      .map((d: { actual_close_date: string; created_at: string }) => {
        const created = new Date(d.created_at).getTime();
        const closed = new Date(d.actual_close_date).getTime();
        return Math.round((closed - created) / (1000 * 60 * 60 * 24));
      });
    const avgCycleTime =
      cycleTimeDays.length > 0
        ? Math.round(cycleTimeDays.reduce((s, v) => s + v, 0) / cycleTimeDays.length)
        : 0;

    // Value by stage
    interface StageInfo {
      id: string;
      name: string;
      color: string;
      position: number;
    }
    const stageMap = new Map<string, { name: string; color: string; value: number; count: number; position: number }>();
    for (const deal of openDeals) {
      const stage = (deal as { stage: StageInfo | null }).stage;
      if (!stage) continue;
      const existing = stageMap.get(stage.id) ?? {
        name: stage.name,
        color: stage.color,
        value: 0,
        count: 0,
        position: stage.position,
      };
      existing.value += (deal as { value: number }).value ?? 0;
      existing.count += 1;
      stageMap.set(stage.id, existing);
    }
    const valueByStage = Array.from(stageMap.values()).sort((a, b) => a.position - b.position);

    // Deal trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyDeals = new Map<string, { won: number; lost: number; created: number }>();
    for (const deal of allDeals) {
      const d = deal as { created_at: string; status: string; actual_close_date: string | null };
      const created = new Date(d.created_at);
      if (created >= sixMonthsAgo) {
        const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyDeals.get(key) ?? { won: 0, lost: 0, created: 0 };
        entry.created += 1;
        monthlyDeals.set(key, entry);
      }
      if (d.actual_close_date) {
        const closed = new Date(d.actual_close_date);
        if (closed >= sixMonthsAgo) {
          const key = `${closed.getFullYear()}-${String(closed.getMonth() + 1).padStart(2, '0')}`;
          const entry = monthlyDeals.get(key) ?? { won: 0, lost: 0, created: 0 };
          if (d.status === 'won') entry.won += 1;
          if (d.status === 'lost') entry.lost += 1;
          monthlyDeals.set(key, entry);
        }
      }
    }
    const trends = Array.from(monthlyDeals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    return NextResponse.json({
      success: true,
      data: {
        win_rate: winRate,
        avg_deal_size: avgDealSize,
        avg_cycle_time: avgCycleTime,
        pipeline_value: pipelineValue,
        total_deals: allDeals.length,
        open_deals: openDeals.length,
        won_deals: wonDeals.length,
        lost_deals: lostDeals.length,
        value_by_stage: valueByStage,
        trends,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch analytics' } },
      { status: 500 }
    );
  }
}
