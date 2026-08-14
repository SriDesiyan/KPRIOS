from typing import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings
from app.core.logging import logger


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""

    pass


# Determine async and sync connection strings
database_url = settings.DATABASE_URL
sync_database_url = settings.SYNC_DATABASE_URL

# Provide fallback for local development or testing if needed
if "sqlite" in database_url:
    async_engine = create_async_engine(
        database_url,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},
    )
    sync_engine = create_engine(
        sync_database_url,
        echo=settings.DEBUG,
        connect_args={"check_same_thread": False},
    )
else:
    async_engine = create_async_engine(
        database_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
    sync_engine = create_engine(
        sync_database_url,
        echo=False,
        pool_pre_ping=True,
    )

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async SQLAlchemy database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {str(e)}")
            raise
        finally:
            await session.close()
