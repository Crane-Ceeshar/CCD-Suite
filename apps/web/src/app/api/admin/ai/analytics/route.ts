import { NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET() {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const tenantId = profile.tenant_id;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Fetch raw data in parallel
  const [usageRows, aiSettingsRow] = await Promise.all([
    // All usage rows for this tenant in last 30 days
    serviceClient
      .from('ai_usage_daily')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: true }),

    // AI settings for budget info
    serviceClient
      .from('ai_settings')
      .select('monthly_token_budget, monthly_tokens_used')
      .eq('tenant_id', tenantId)
      .single(),
  ]);

  const rows = usageRows.data ?? [];

  // --- daily: tokens by day ---
  const dailyMap: Record<string, number> = {};
  for (const row of rows) {
    dailyMap[row.date] = (dailyMap[row.date] || 0) + Number(row.tokens_used);
  }
  const daily = Object.entries(dailyMap)
    .map(([date, tokens]) => ({ date, tokens }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- top_users: top 10 by tokens ---
  const userMap: Record<string, { tokens: number; requests: number }> = {};
  for (const row of rows) {
    if (!userMap[row.user_id]) userMap[row.user_id] = { tokens: 0, requests: 0 };
    userMap[row.user_id].tokens += Number(row.tokens_used);
    userMap[row.user_id].requests += Number(row.request_count);
  }

  const topUserIds = Object.entries(userMap)
    .sort(([, a], [, b]) => b.tokens - a.tokens)
    .slice(0, 10);

  // Fetch profile names for top users
  let topUsers: Array<{ user_id: string; full_name: string; email: string; tokens: number; requests: number }> = [];
  if (topUserIds.length > 0) {
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, full_name, email')
      .in(
        'id',
        topUserIds.map(([id]) => id)
      );

    const profileMap: Record<string, { full_name: string; email: string }> = {};
    for (const p of profiles ?? []) {
      profileMap[p.id] = { full_name: p.full_name ?? '', email: p.email ?? '' };
    }

    topUsers = topUserIds.map(([userId, usage]) => ({
      user_id: userId,
      full_name: profileMap[userId]?.full_name ?? 'Unknown',
      email: profileMap[userId]?.email ?? '',
      tokens: usage.tokens,
      requests: usage.requests,
    }));
  }

  // --- feature_breakdown ---
  let totalChat = 0;
  let totalGeneration = 0;
  let totalInsight = 0;
  for (const row of rows) {
    totalChat += Number(row.chat_count);
    totalGeneration += Number(row.generation_count);
    totalInsight += Number(row.insight_count);
  }
  const featureBreakdown = {
    chat: totalChat,
    generation: totalGeneration,
    insights: totalInsight,
  };

  // --- summary ---
  let totalTokens = 0;
  for (const row of rows) {
    totalTokens += Number(row.tokens_used);
  }

  const activeUserIds = new Set(rows.map((r) => r.user_id));
  const budget = aiSettingsRow.data?.monthly_token_budget ?? 1_000_000;
  const used = aiSettingsRow.data?.monthly_tokens_used ?? 0;

  // Rough cost estimate: ~$3 per 1M input tokens (Claude Sonnet average)
  const estimatedCost = Number((totalTokens * 0.000003).toFixed(2));
  const budgetRemaining = Math.max(budget - used, 0);

  const summary = {
    total_tokens: totalTokens,
    estimated_cost: estimatedCost,
    active_users: activeUserIds.size,
    budget_remaining: budgetRemaining,
  };

  return NextResponse.json({
    success: true,
    data: {
      daily,
      top_users: topUsers,
      feature_breakdown: featureBreakdown,
      summary,
    },
  });
}
