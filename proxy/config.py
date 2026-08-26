"""
Application settings loaded from environment / .env file.
All components import from here — single source of truth.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    log_level: str = "INFO"

    # LLM backend: "mock" | "live"
    llm_backend: str = "mock"

    # API Keys (only needed when llm_backend=live)
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    groq_api_key: str = ""
    gemini_api_key: str = ""
    
    # Default model for live completions
    llm_model: str = "gpt-4o-mini"

    # Postgres (Local fallbacks)
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str = "controlplane"
    postgres_password: str = "controlplane"
    postgres_db: str = "controlplane"
    
    # Direct URLs (For Supabase / Deployments)
    database_url: str | None = None
    redis_url_override: str | None = None

    # Redis (Local fallbacks)
    redis_host: str = "localhost"
    redis_port: int = 6379

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"

    # Policy defaults (used when no org-specific config exists)
    default_grounding_similarity_min: float = 0.75
    default_loop_count_max: int = 3

    @property
    def postgres_url(self) -> str:
        if self.database_url:
            # SQLAlchemy asyncpg requires postgresql+asyncpg://
            url = self.database_url
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
            
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        if self.redis_url_override:
            return self.redis_url_override
        return f"redis://{self.redis_host}:{self.redis_port}"


settings = Settings()
