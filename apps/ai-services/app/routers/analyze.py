"""Text analysis endpoint (sentiment, summary, categorize, keywords)."""

import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..clients.anthropic_client import get_anthropic_client
from ..config import settings

router = APIRouter(prefix="/api/ai/analyze", tags=["analyze"])

ANALYSIS_SYSTEM_PROMPT = (
    "You are a text analysis engine. Analyse the given text and return ONLY valid JSON "
    "(no markdown fencing, no extra text). The JSON must contain only the requested analysis keys."
)

ANALYSIS_INSTRUCTIONS: dict[str, str] = {
    "sentiment": (
        'For "sentiment": return an object with "label" (one of "positive", "negative", "neutral", "mixed"), '
        '"score" (float -1 to 1), and "confidence" (float 0 to 1).'
    ),
    "summary": (
        'For "summary": return a string with a concise summary (max 3 sentences).'
    ),
    "categorize": (
        'For "categorize": return an object with "primary_category" (string), '
        '"secondary_categories" (array of strings), and "confidence" (float 0 to 1).'
    ),
    "keywords": (
        'For "keywords": return an array of objects, each with "keyword" (string) '
        'and "relevance" (float 0 to 1). Return up to 10 keywords.'
    ),
}


class AnalyzeRequest(BaseModel):
    text: str
    analyses: list[str]
    context: dict | None = None


class AnalyzeResponse(BaseModel):
    results: dict
    model: str
    tokens_used: int | None = None


@router.post("/", response_model=AnalyzeResponse)
async def analyze_text(body: AnalyzeRequest):
    """Perform one or more text analyses."""
    # Build instruction for requested analyses
    instructions = "\n".join(
        ANALYSIS_INSTRUCTIONS[a]
        for a in body.analyses
        if a in ANALYSIS_INSTRUCTIONS
    )
    if not instructions:
        raise HTTPException(status_code=400, detail="No valid analyses requested")

    user_prompt = (
        f"Analyse the following text and return a JSON object with keys: "
        f"{', '.join(body.analyses)}.\n\n{instructions}\n\nText to analyse:\n\n{body.text}"
    )

    if body.context:
        user_prompt += f"\n\nAdditional context: {json.dumps(body.context, default=str)}"

    client = get_anthropic_client()

    try:
        response = await client.messages.create(
            model=settings.default_model,
            max_tokens=2048,
            system=ANALYSIS_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}") from exc

    raw = response.content[0].text if response.content else "{}"
    tokens = (
        (response.usage.input_tokens + response.usage.output_tokens)
        if response.usage
        else None
    )

    # Parse JSON response
    try:
        results = json.loads(raw)
    except json.JSONDecodeError:
        results = {"raw": raw}

    return AnalyzeResponse(results=results, model=response.model, tokens_used=tokens)
