import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_async_db, get_current_user
from app.core.config import settings
from app.core.logging import logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    MessageResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    TokenResponse,
    UserLogin,
    UserResponse,
)

router = APIRouter(tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate User & Issue Tokens",
    description="Validates email and password, returning short-lived access token and refresh token.",
)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_async_db),
) -> TokenResponse:
    stmt = select(User).where(User.email == login_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    logger.info(
        f"User logged in successfully: id={user.id}, email={user.email}, role={user.role.value}"
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=TokenRefreshResponse,
    summary="Refresh Access Token",
    description="Issues a fresh access token using a valid, unexpired refresh token.",
)
async def refresh_token(
    refresh_data: TokenRefreshRequest,
    db: AsyncSession = Depends(get_async_db),
) -> TokenRefreshResponse:
    try:
        payload = decode_token(refresh_data.refresh_token)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")

        if user_id is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token signature or payload",
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with refresh token no longer exists",
        )

    new_access_token = create_access_token(subject=user.id, role=user.role.value)
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role.value)

    logger.info(f"Refreshed tokens for user id={user.id}")

    return TokenRefreshResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout User Session",
    description="Terminates active session and instructs client to purge JWT credentials.",
)
async def logout(
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    logger.info(f"User logged out: id={current_user.id}, email={current_user.email}")
    return MessageResponse(
        message="Logged out successfully. Client should discard all stored tokens.",
        status="success",
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Profile",
    description="Returns authenticated user details including investigator role and account timestamp.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)
