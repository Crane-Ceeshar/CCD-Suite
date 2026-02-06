from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "CCD AI Services"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 5100

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # AI Providers
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Model defaults
    default_model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 4096

    model_config = {"env_prefix": "AI_"}


settings = Settings()
