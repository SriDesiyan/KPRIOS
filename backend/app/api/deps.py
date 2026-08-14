import enum
from typing import Callable, List, Optional

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.core.logging import logger
from app.core.security import decode_token
from app.models.user import User, UserRole

security_bearer = HTTPBearer(auto_error=True)


class InviolablePolicyError(HTTPException):
    """
    Raised when an automated agent or unpermitted entity attempts to execute
    a Tier 3 'ONLY' action (e.g. guilt declaration, victim attribution).
    No executable function exists for Tier 3.
    """

    def __init__(
        self,
        detail: str = "Action violates Tier 3 Policy: ONLY humans in designated judicial roles can make this determination.",
    ):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ActionTier(str, enum.Enum):
    AUTO = "AUTO"  # Hashing, OCR, extraction, dedup, graph update, EIG calc
    REVIEW = "REVIEW"  # Entity merge, hypothesis elevation, action execution, report export
    ONLY = "ONLY"  # Guilt declaration, victim identity confirmation, suspect attribution


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_bearer),
    db: AsyncSession = Depends(get_async_db),
) -> User:
    """Validates JWT access token and returns the authenticated User record."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        logger.warning(f"JWT validation error: {str(e)}")
        raise credentials_exception

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


def require_role(allowed_roles: List[UserRole]) -> Callable:
    """Dependency factory restricting endpoints to specified UserRole(s)."""

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            logger.warning(
                f"Unauthorized role access attempt: user={current_user.email}, role={current_user.role}, required={allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Role '{current_user.role.value}' lacks required permissions",
            )
        return current_user

    return role_checker


def enforce_three_tier_action(tier: ActionTier):
    """
    Three-tier authorization guard enforced in code:
    - AUTO: Permits immediate execution.
    - REVIEW: Requires human investigator/supervisor approval.
    - ONLY: Strict prohibition — raises InviolablePolicyError immediately.
    """
    if tier == ActionTier.ONLY:
        raise InviolablePolicyError(
            "Action blocked: Tier 3 'ONLY' operations have no executable automated function."
        )
    return True
