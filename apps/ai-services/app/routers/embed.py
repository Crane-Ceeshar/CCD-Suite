"""Embedding endpoint — generates vector embeddings via OpenAI."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI

from ..config import settings

router = APIRouter(prefix="/api/ai", tags=["embeddings"])

EMBED_MODEL = "text-embedding-3-small"  # 1536 dimensions


def _get_openai_client() -> OpenAI:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured (set AI_OPENAI_API_KEY)",
        )
    return OpenAI(api_key=settings.openai_api_key)


class EmbedRequest(BaseModel):
    """Single text or batch of texts to embed."""

    text: str | None = None
    texts: list[str] | None = Field(None, max_length=100)


class SingleEmbedResponse(BaseModel):
    embedding: list[float]
    model: str
    dimensions: int


class BatchEmbedResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    dimensions: int
    count: int


@router.post("/embed")
async def create_embedding(body: EmbedRequest):
    """Generate embeddings for one or more text inputs."""

    if body.text is None and body.texts is None:
        raise HTTPException(
            status_code=400,
            detail="Provide either 'text' (single) or 'texts' (batch)",
        )

    client = _get_openai_client()

    # --- single text ---
    if body.text is not None:
        result = client.embeddings.create(model=EMBED_MODEL, input=body.text)
        return SingleEmbedResponse(
            embedding=result.data[0].embedding,
            model=result.model,
            dimensions=len(result.data[0].embedding),
        )

    # --- batch ---
    texts = body.texts or []
    if len(texts) == 0:
        raise HTTPException(status_code=400, detail="'texts' array must not be empty")

    result = client.embeddings.create(model=EMBED_MODEL, input=texts)
    embeddings = [item.embedding for item in result.data]

    return BatchEmbedResponse(
        embeddings=embeddings,
        model=result.model,
        dimensions=len(embeddings[0]) if embeddings else 0,
        count=len(embeddings),
    )
