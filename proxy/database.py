"""Async Postgres connection pool (SQLAlchemy 2 async engine)."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from proxy.config import settings

engine = create_async_engine(
    settings.postgres_url,
    pool_size=10,
    max_overflow=20,
    echo=(settings.app_env == "development"),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields a database session and closes it after the request."""
    async with AsyncSessionLocal() as session:
        yield session
