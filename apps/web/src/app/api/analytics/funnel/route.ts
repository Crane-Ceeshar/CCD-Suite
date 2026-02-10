import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { funnelQuerySchema } from '@/lib/api/schemas/analytics-advanced';
import { getPeriodStart } from '@/lib/analytics/period-helpers';

const FUNNEL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

/**
 * GET /api/analytics/funnel
 * CRM pipeline funnel analysis with conversion rates between stages.
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    funnelQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  try {
    const { period } = query!;
    const since = getPeriodStart(period);

    // Fetch all deals in the period
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select('id, status')
      .gte('created_at', since);

    if (dealsError) {
      return error('Failed to fetch deals for funnel', 500);
    }

    const allDeals = deals ?? [];

    // Count deals per stage
    const stageCounts: Record<string, number> = {};
    for (const stage of FUNNEL_STAGES) {
      stageCounts[stage] = allDeals.filter((d) => d.status === stage).length;
    }

    // For funnel analysis, cumulative counts represent deals that reached at least that stage.
    // "lead" includes all deals; "qualified" includes qualified + proposal + negotiation + won;
    // "lost" is treated separately as an exit from the funnel.
    const funnelStages = FUNNEL_STAGES.filter((s) => s !== 'lost');
    const cumulativeCounts: number[] = [];

    // Build cumulative: each stage count = deals at that stage + all later stages (excluding lost)
    for (let i = 0; i < funnelStages.length; i++) {
      let count = 0;
      for (let j = i; j < funnelStages.length; j++) {
        count += stageCounts[funnelStages[j]] ?? 0;
      }
      cumulativeCounts.push(count);
    }

    const stages: { name: string; count: number; conversionRate: number; dropoffRate: number }[] =
      funnelStages.map((name, i) => {
        const count = cumulativeCounts[i];
        const prevCount = i > 0 ? cumulativeCounts[i - 1] : count;
        const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 10000) / 100 : 0;
        const dropoffRate = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 10000) / 100 : 0;

        return {
          name,
          count,
          conversionRate: i === 0 ? 100 : conversionRate,
          dropoffRate: i === 0 ? 0 : dropoffRate,
        };
      });

    // Add lost as a separate entry
    stages.push({
      name: 'lost',
      count: stageCounts.lost ?? 0,
      conversionRate: 0,
      dropoffRate: 0,
    });

    const response = success({
      period,
      total_deals: allDeals.length,
      stages,
    });
    response.headers.set('Cache-Control', 'private, max-age=120');
    return response;
  } catch (err) {
    console.error('Funnel analysis error:', err);
    return error('Failed to compute funnel analysis');
  }
}
