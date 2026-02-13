import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateUuid } from '@/lib/api/security';
import { rateLimit } from '@/lib/api/rate-limit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'crm:pipelines:get' });
  if (limited) return limitResp!;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Pipeline');
  if (uuidError) return uuidError;

  const { data, error: queryError } = await supabase
    .from('pipelines')
    .select(
      '*, stages:pipeline_stages(*, deals(*, company:companies(id, name), contact:contacts(id, first_name, last_name)))'
    )
    .eq('id', id)
    .single();

  if (queryError) return dbError(queryError, 'Pipeline');

  // Sort stages by position, and deals within each stage by position
  interface DealWithPosition {
    position: number;
    [key: string]: unknown;
  }
  interface StageWithDeals {
    position: number;
    deals: DealWithPosition[];
    [key: string]: unknown;
  }

  const pipeline = {
    ...data,
    stages: ((data as { stages: StageWithDeals[] }).stages ?? [])
      .sort((a: StageWithDeals, b: StageWithDeals) => a.position - b.position)
      .map((stage: StageWithDeals) => ({
        ...stage,
        deals: (stage.deals ?? []).sort(
          (a: DealWithPosition, b: DealWithPosition) => a.position - b.position
        ),
      })),
  };

  return success(pipeline);
}
