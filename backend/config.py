from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
import warnings


class Settings(BaseSettings):
    # App
    secret_key: str = "dev-secret-key"
    encryption_key: str = ""
    debug: bool = True
    api_base_url: str = "https://orstra-ai.onrender.com"

    # Database
    database_url: str = "postgresql://orstra:orstra_password@localhost:5432/orstra"

    # Anthropic (Claude)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-7-sonnet-20250219"

    # Google
    google_custom_search_api_key: str = ""
    google_search_engine_id: str = ""

    # Pricing (per 1M tokens)
    claude_input_cost: float = 3.0
    claude_output_cost: float = 15.0

    @field_validator("secret_key")
    @classmethod
    def warn_insecure_secret_key(cls, v: str) -> str:
        if v == "dev-secret-key":
            warnings.warn(
                "\n\n⚠️  WARNING: Using default SECRET_KEY='dev-secret-key'.\n"
                "   This is insecure in production — anyone can forge login tokens.\n"
                "   Set a real SECRET_KEY in your .env file:\n"
                "   python3 -c \"import secrets; print(secrets.token_hex(32))\"\n",
                stacklevel=2,
            )
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
