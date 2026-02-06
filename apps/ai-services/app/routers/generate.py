"""Content generation endpoint."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..clients.anthropic_client import get_anthropic_client
from ..config import settings

router = APIRouter(prefix="/api/ai/generate", tags=["generate"])

# ---------------------------------------------------------------------------
# Type-specific system prompts
# ---------------------------------------------------------------------------

GENERATION_PROMPTS: dict[str, str] = {
    "blog_post": (
        "You are a professional blog writer for a digital agency. Write engaging, well-structured "
        "blog posts with clear headings, an introduction, body paragraphs, and a conclusion. "
        "Use a professional yet approachable tone."
    ),
    "social_caption": (
        "You are a social media copywriter. Write short, engaging captions optimised for social "
        "platforms. Include relevant emoji suggestions and hashtag recommendations."
    ),
    "ad_copy": (
        "You are an advertising copywriter. Write compelling ad copy with strong headlines, "
        "clear value propositions, and persuasive calls to action."
    ),
    "email_draft": (
        "You are a professional email writer. Draft clear, well-structured emails with "
        "appropriate greetings, body content, and sign-offs."
    ),
    "seo_description": (
        "You are an SEO specialist. Write optimised meta descriptions and page summaries "
        "that are compelling for users and effective for search engines. Keep descriptions "
        "under 160 characters when appropriate."
    ),
    "summary": (
        "You are a skilled summariser. Provide concise, accurate summaries that capture "
        "the key points and main ideas of the source material."
    ),
    "custom": (
        "You are CCD AI, a versatile writing assistant for a digital agency. "
        "Follow the user's instructions carefully and produce high-quality content."
    ),
}


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    type: str
    prompt: str
    context: dict | None = None
    max_tokens: int | None = None


class GenerateResponse(BaseModel):
    content: str
    type: str
    model: str
    tokens_used: int | None = None


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/", response_model=GenerateResponse)
async def generate_content(body: GenerateRequest):
    """Generate content of a specific type."""
    system_prompt = GENERATION_PROMPTS.get(body.type, GENERATION_PROMPTS["custom"])

    if body.context:
        system_prompt += f"\n\nAdditional context: {body.context}"

    client = get_anthropic_client()
    max_tokens = body.max_tokens or settings.max_tokens

    try:
        response = await client.messages.create(
            model=settings.default_model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": body.prompt}],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}") from exc

    content = response.content[0].text if response.content else ""
    tokens = (
        (response.usage.input_tokens + response.usage.output_tokens)
        if response.usage
        else None
    )

    return GenerateResponse(
        content=content,
        type=body.type,
        model=response.model,
        tokens_used=tokens,
    )
