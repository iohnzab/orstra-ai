from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    secret_key: str = "dev-secret-key"
    encryption_key: str = ""
    debug: bool = True

    # Database
    database_url: str = "postgresql://orstra:orstra_password@localhost:5432/orstra"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Anthropic (Claude)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-5-sonnet-20241022"

    # Google
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"
    google_custom_search_api_key: str = ""
    google_search_engine_id: str = ""

    # Pricing (per 1M tokens) — Claude 3.5 Sonnet
    claude_input_cost: float = 3.0
    claude_output_cost: float = 15.0

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
