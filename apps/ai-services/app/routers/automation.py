"""Automation execution endpoint — runs AI-powered automations by type."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from anthropic import Anthropic

from ..config import settings

router = APIRouter(prefix="/api/ai", tags=["automation"])

AUTOMATION_PROMPTS: dict[str, str] = {
    "expense_categorization": (
        "You are a financial categorisation assistant. Analyse the following expenses and "
        "assign each one an appropriate category (e.g., Travel, Office Supplies, Marketing, "
        "Software, Utilities, Professional Services, etc.). Return a JSON array with each "
        "expense and its assigned category."
    ),
    "seo_recommendations": (
        "You are an SEO expert. Analyse the following website data and generate actionable "
        "SEO improvement recommendations. Focus on keyword opportunities, content gaps, "
        "technical improvements, and backlink strategies. Return structured recommendations."
    ),
    "sentiment_analysis": (
        "You are a brand sentiment analyst. Analyse the following social media comments and "
        "messages. Classify each as positive, negative, or neutral. Identify key themes and "
        "flag any urgent negative trends. Return a structured analysis."
    ),
    "deal_scoring": (
        "You are a CRM deal scoring assistant. Analyse the following deal data and score each "
        "deal from 0-100 based on likelihood to close. Consider factors like engagement "
        "history, deal size, timeline, and stage progression. Return scores with reasoning."
    ),
    "content_suggestions": (
        "You are a content strategist. Based on the following data about audience engagement, "
        "trending topics, and existing content, suggest new blog topics, social media posts, "
        "and marketing campaign ideas. Return structured suggestions with titles and briefs."
    ),
}


def _get_anthropic_client() -> Anthropic:
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured (set AI_ANTHROPIC_API_KEY)",
        )
    return Anthropic(api_key=settings.anthropic_api_key)


class AutomationRunRequest(BaseModel):
    automation_type: str
    automation_config: dict = {}
    tenant_id: str


class AutomationRunResponse(BaseModel):
    result: dict
    tokens_used: int
    items_processed: int
    model: str


@router.post("/automation/run")
async def run_automation(body: AutomationRunRequest) -> AutomationRunResponse:
    """Execute an AI automation by type."""

    system_prompt = AUTOMATION_PROMPTS.get(body.automation_type)
    if not system_prompt:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown automation type: {body.automation_type}",
        )

    client = _get_anthropic_client()

    # Build a user message from the config context
    user_message = (
        f"Automation type: {body.automation_type}\n"
        f"Configuration: {body.automation_config}\n\n"
        "Please analyse the available data and provide your results. "
        "If no specific data is provided in the configuration, generate "
        "sample recommendations based on common patterns for this type of automation."
    )

    response = client.messages.create(
        model=settings.default_model,
        max_tokens=settings.max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )

    content = response.content[0].text if response.content else ""
    tokens_used = (response.usage.input_tokens or 0) + (response.usage.output_tokens or 0)

    return AutomationRunResponse(
        result={
            "output": content,
            "automation_type": body.automation_type,
        },
        tokens_used=tokens_used,
        items_processed=1,
        model=response.model,
    )
