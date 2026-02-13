from .chat import router as chat_router
from .generate import router as generate_router
from .analyze import router as analyze_router
from .insights import router as insights_router
from .embed import router as embed_router
from .automation import router as automation_router

__all__ = ["chat_router", "generate_router", "analyze_router", "insights_router", "embed_router", "automation_router"]
