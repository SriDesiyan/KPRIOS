import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_async_db
from app.core.security import get_password_hash
from app.main import app
from app.models.user import User, UserRole

# Use in-memory SQLite for fast, isolated test execution
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Provides a fresh transactional test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        # Pre-seed test users
        investigator = User(
            id="test-investigator-uuid-001",
            email="investigator@test.police.in",
            hashed_password=get_password_hash("InvestigatorPass123!"),
            role=UserRole.INVESTIGATOR,
        )
        supervisor = User(
            id="test-supervisor-uuid-002",
            email="supervisor@test.police.in",
            hashed_password=get_password_hash("SupervisorPass123!"),
            role=UserRole.SUPERVISOR,
        )
        auditor = User(
            id="test-auditor-uuid-003",
            email="auditor@test.police.in",
            hashed_password=get_password_hash("AuditorPass123!"),
            role=UserRole.AUDITOR,
        )
        session.add_all([investigator, supervisor, auditor])
        await session.commit()
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession):
    """Provides an AsyncClient connected to the FastAPI app with test db override."""

    async def override_get_async_db():
        yield db_session

    app.dependency_overrides[get_async_db] = override_get_async_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()
