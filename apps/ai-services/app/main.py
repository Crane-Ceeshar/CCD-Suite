from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from .config import settings

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ai-services",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/ai/status")
async def ai_status():
    return {
        "status": "ok",
        "providers": {
            "openai": bool(settings.openai_api_key),
            "anthropic": bool(settings.anthropic_api_key),
        },
    }
