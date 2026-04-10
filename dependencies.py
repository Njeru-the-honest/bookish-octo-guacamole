from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.utils.security import decode_access_token
from app.services.auth_service import get_user_by_id
from app.models.enums import UserRole

# OAuth2 scheme — points to our login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> dict:
    """
    Decode JWT token and return the current authenticated user.
    Raises 401 if token is invalid or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = await get_user_by_id(user_id, db)
    if user is None:
        raise credentials_exception

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    return user


async def require_role(*roles: UserRole):
    """
    Factory function that returns a dependency
    which enforces that the current user has one of the given roles.

    Usage:
        Depends(require_role(UserRole.admin))
        Depends(require_role(UserRole.tutor, UserRole.admin))
    """
    async def role_checker(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        if current_user["role"] not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): "
                       f"{[r.value for r in roles]}",
            )
        return current_user
    return role_checker


# ─── Pre-built role dependencies ─────────────────────────────────────────────

async def require_student(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Allow only students."""
    if current_user["role"] != UserRole.student.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Students only.",
        )
    return current_user


async def require_tutor(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Allow only approved tutors."""
    if current_user["role"] != UserRole.tutor.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Tutors only.",
        )
    return current_user


async def require_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Allow only admins."""
    if current_user["role"] != UserRole.admin.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admins only.",
        )
    return current_user


async def require_tutor_or_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Allow tutors or admins."""
    if current_user["role"] not in [
        UserRole.tutor.value,
        UserRole.admin.value
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Tutors or Admins only.",
        )
    return current_user


async def require_student_or_admin(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Allow students or admins."""
    if current_user["role"] not in [
        UserRole.student.value,
        UserRole.admin.value
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Students or Admins only.",
        )
    return current_user