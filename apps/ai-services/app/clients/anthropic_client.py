import anthropic
from ..config import settings


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    """Return an async Anthropic client using the configured API key."""
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY (AI_ANTHROPIC_API_KEY) is not configured")
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
