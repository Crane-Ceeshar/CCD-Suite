"""AI insights generation endpoint."""

import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..clients.anthropic_client import get_anthropic_client
from ..clients.supabase_client import SupabaseClient
from ..config import settings

router = APIRouter(prefix="/api/ai/insights", tags=["insights"])

INSIGHT_SYSTEM_PROMPT = (
    "You are a business intelligence analyst for a digital agency. "
    "Given the following data, generate actionable insights as a JSON array. "
    "Each insight object must have: "
    '"title" (string, short), "summary" (string, 1-2 sentences), '
    '"type" (one of: deal_score, sales_forecast, anomaly_detection, trend_narration, '
    "keyword_suggestion, expense_categorization, sentiment_analysis, general), "
    '"details" (object with supporting data). '
    "Return ONLY valid JSON (no markdown fencing). Generate 3-5 insights."
)

CATEGORY_DATA_QUERIES: dict[str, dict] = {
    "crm": {
        "table": "deals",
        "select": "id,title,value,stage,probability,expected_close_date",
        "order": "created_at.desc",
        "limit": 20,
    },
    "finance": {
        "table": "expenses",
        "select": "id,description,amount,category,date",
        "order": "date.desc",
        "limit": 30,
    },
    "seo": {
        "table": "seo_keywords",
        "select": "id,keyword,search_volume,difficulty,current_rank",
        "order": "created_at.desc",
        "limit": 20,
    },
    "social": {
        "table": "social_posts",
        "select": "id,platform,content,likes_count,comments_count,shares_count,published_at",
        "order": "published_at.desc",
        "limit": 20,
    },
    "analytics": {
        "table": "analytics_events",
        "select": "id,event_name,properties,created_at",
        "order": "created_at.desc",
        "limit": 50,
    },
}


class InsightsRequest(BaseModel):
    tenant_id: str
    category: str
    additional_context: str | None = None


class Insight(BaseModel):
    title: str
    summary: str
    type: str
    details: dict


class InsightsResponse(BaseModel):
    insights: list[Insight]
    category: str
    model: str
    tokens_used: int | None = None


@router.post("/generate", response_model=InsightsResponse)
async def generate_insights(body: InsightsRequest):
    """Fetch module data from Supabase and generate AI insights."""
    query_config = CATEGORY_DATA_QUERIES.get(body.category)
    data_context = ""

    if query_config:
        try:
            sb = SupabaseClient()
            rows = await sb.query(
                query_config["table"],
                select=query_config["select"],
                filters={"tenant_id": f"eq.{body.tenant_id}"},
                order=query_config.get("order"),
                limit=query_config.get("limit"),
            )
            data_context = json.dumps(rows, default=str)
        except Exception:
            data_context = "Unable to fetch module data — generate general insights instead."
    else:
        data_context = "No specific data available for this category."

    user_prompt = (
        f"Category: {body.category}\n\n"
        f"Data:\n{data_context}"
    )
    if body.additional_context:
        user_prompt += f"\n\nAdditional context: {body.additional_context}"

    client = get_anthropic_client()

    try:
        response = await client.messages.create(
            model=settings.default_model,
            max_tokens=2048,
            system=INSIGHT_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}") from exc

    raw = response.content[0].text if response.content else "[]"
    tokens = (
        (response.usage.input_tokens + response.usage.output_tokens)
        if response.usage
        else None
    )

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict) and "insights" in parsed:
            parsed = parsed["insights"]
        insights = [Insight(**i) for i in parsed] if isinstance(parsed, list) else []
    except (json.JSONDecodeError, TypeError):
        insights = [
            Insight(
                title="AI Analysis",
                summary=raw[:200],
                type="general",
                details={"raw_response": raw},
            )
        ]

    return InsightsResponse(
        insights=insights,
        category=body.category,
        model=response.model,
        tokens_used=tokens,
    )
