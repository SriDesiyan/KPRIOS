from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.api.auth import router as direct_auth_router
from app.api.router import api_router
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, async_engine
from app.core.logging import logger
from app.core.security import get_password_hash
from app.middleware.logging_middleware import StructuredLoggingMiddleware
from app.models.user import User, UserRole


async def seed_initial_users():
    """Seeds default demo investigator accounts if not already existing."""
    try:
        # First ensure tables are created in development if using sqlite
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        async with AsyncSessionLocal() as session:
            stmt = select(User).limit(1)
            result = await session.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if not existing_user:
                logger.info("No users found in database. Seeding demo accounts...")
                demo_users = [
                    User(
                        email="investigator@kpyrios.police.in",
                        hashed_password=get_password_hash("Investigator@2026"),
                        role=UserRole.INVESTIGATOR,
                    ),
                    User(
                        email="supervisor@kpyrios.police.in",
                        hashed_password=get_password_hash("Supervisor@2026"),
                        role=UserRole.SUPERVISOR,
                    ),
                    User(
                        email="auditor@kpyrios.police.in",
                        hashed_password=get_password_hash("Auditor@2026"),
                        role=UserRole.AUDITOR,
                    ),
                ]
                session.add_all(demo_users)
                await session.commit()
                logger.info("Successfully seeded demo investigator accounts.")
    except Exception as e:
        logger.error(f"Error during user initialization/seeding: {str(e)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} backend service...")
    await seed_initial_users()
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} backend service...")
    await async_engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API Service for KPYRIOS-ACPIA (Agentic Child Protection Investigation Assistant)",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured JSON request logging middleware
app.add_middleware(StructuredLoggingMiddleware)

# Mount API routers (both under prefix /api/v1 and directly /auth for flexible routing)
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(direct_auth_router, prefix="/auth")


@app.get("/", tags=["System"])
async def root():
    return {
        "service": "KPYRIOS-ACPIA",
        "description": "Agentic Child Protection Investigation Assistant API",
        "version": "0.1.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2026-08-14T00:00:00Z",
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0",
    }


@app.get("/health/db", tags=["System"])
async def health_db_check():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(select(1))
        return {
            "database": "connected",
            "status": "healthy",
            "timestamp": "2026-08-14T00:00:00Z",
        }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"database": "disconnected", "status": "unhealthy", "error": str(e)},
        )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error occurred. Transaction rolled back."},
    )
