"""Chat completion and streaming endpoints."""

import json
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from ..clients.anthropic_client import get_anthropic_client
from ..config import settings

router = APIRouter(prefix="/api/ai/chat", tags=["chat"])

# ---------------------------------------------------------------------------
# System prompts per module context
# ---------------------------------------------------------------------------

MODULE_SYSTEM_PROMPTS: dict[str, str] = {
    "crm": (
        "You are a CRM assistant for a digital agency. Help with client relationships, "
        "sales pipeline management, deal tracking, and contact management. "
        "Provide actionable advice on closing deals and nurturing leads."
    ),
    "analytics": (
        "You are an analytics assistant. Help interpret marketing and business metrics, "
        "identify trends, explain anomalies, and suggest data-driven actions."
    ),
    "content": (
        "You are a content strategy assistant. Help plan, create, and optimise marketing content "
        "including blog posts, social media captions, email campaigns, and ad copy."
    ),
    "seo": (
        "You are an SEO specialist assistant. Help with keyword research, on-page optimisation, "
        "technical SEO audits, and search ranking strategies."
    ),
    "social": (
        "You are a social media management assistant. Help plan posting schedules, "
        "craft engaging posts, analyse engagement metrics, and grow audience reach."
    ),
    "finance": (
        "You are a finance assistant for a digital agency. Help with invoicing, expense tracking, "
        "budget analysis, revenue forecasting, and financial reporting."
    ),
    "projects": (
        "You are a project management assistant. Help with task planning, sprint management, "
        "resource allocation, timeline estimation, and workflow optimisation."
    ),
    "hr": (
        "You are an HR assistant. Help with employee management, recruitment, onboarding, "
        "leave tracking, and team coordination."
    ),
}

DEFAULT_SYSTEM_PROMPT = (
    "You are CCD AI, an intelligent assistant for the Crane & Ceeshar Digital agency platform. "
    "You help agency staff with CRM, analytics, content, SEO, social media, projects, finance, "
    "and HR tasks. Be concise, professional, and actionable in your responses."
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class MessagePayload(BaseModel):
    role: str = "user"
    content: str


class ChatRequest(BaseModel):
    messages: list[MessagePayload]
    module_context: str | None = None
    entity_context: dict | None = None
    max_tokens: int | None = None


class ChatResponse(BaseModel):
    content: str
    model: str
    tokens_used: int | None = None
    stop_reason: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_system_prompt(module_context: str | None, entity_context: dict | None) -> str:
    base = MODULE_SYSTEM_PROMPTS.get(module_context or "", DEFAULT_SYSTEM_PROMPT)
    if entity_context:
        base += (
            f"\n\nCurrent context — Entity type: {entity_context.get('entity_type', 'unknown')}, "
            f"Entity ID: {entity_context.get('entity_id', 'N/A')}."
        )
        if entity_context.get("entity_data"):
            base += f"\nEntity data: {json.dumps(entity_context['entity_data'], default=str)}"
    return base


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/completions", response_model=ChatResponse)
async def chat_completion(body: ChatRequest):
    """Non-streaming chat completion."""
    client = get_anthropic_client()
    system_prompt = _build_system_prompt(body.module_context, body.entity_context)
    max_tokens = body.max_tokens or settings.max_tokens

    try:
        response = await client.messages.create(
            model=settings.default_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": m.role, "content": m.content} for m in body.messages],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}") from exc

    content = response.content[0].text if response.content else ""
    tokens = (
        (response.usage.input_tokens + response.usage.output_tokens)
        if response.usage
        else None
    )

    return ChatResponse(
        content=content,
        model=response.model,
        tokens_used=tokens,
        stop_reason=response.stop_reason,
    )


@router.post("/stream")
async def chat_stream(body: ChatRequest):
    """SSE streaming chat completion."""
    client = get_anthropic_client()
    system_prompt = _build_system_prompt(body.module_context, body.entity_context)
    max_tokens = body.max_tokens or settings.max_tokens

    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            async with client.messages.stream(
                model=settings.default_model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=[{"role": m.role, "content": m.content} for m in body.messages],
            ) as stream:
                async for text in stream.text_stream:
                    yield {"event": "text", "data": text}

                # After stream finishes, send final metadata
                final = await stream.get_final_message()
                tokens = (
                    (final.usage.input_tokens + final.usage.output_tokens)
                    if final.usage
                    else None
                )
                yield {
                    "event": "done",
                    "data": json.dumps({
                        "model": final.model,
                        "tokens_used": tokens,
                        "stop_reason": final.stop_reason,
                    }),
                }
        except Exception as exc:
            yield {"event": "error", "data": str(exc)}

    return EventSourceResponse(event_generator())
