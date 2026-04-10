from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.schemas.user import (
    UserRegisterSchema,
    UserLoginSchema,
    UserResponseSchema,
    TokenSchema,
)
from app.schemas.base import BaseResponse
from app.services.auth_service import register_user, login_user
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=BaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    data: UserRegisterSchema,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Register a new user account.

    - All new users are assigned the **student** role by default.
    - To become a tutor, a user must submit a tutor application after registering.
    - Email must be unique across the system.
    """
    try:
        user = await register_user(data, db)
        return BaseResponse(
            success=True,
            message="Registration successful. You can now log in.",
            data=user,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/login",
    response_model=TokenSchema,
    summary="Login and receive a JWT token",
)
async def login(
    data: UserLoginSchema,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Authenticate with email and password.

    Returns a JWT access token and the authenticated user's profile.
    Use the token in the `Authorization: Bearer <token>` header for
    all protected endpoints.
    """
    try:
        result = await login_user(data, db)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get(
    "/me",
    response_model=BaseResponse,
    summary="Get current authenticated user",
)
async def get_me(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns the profile of the currently authenticated user.

    Requires a valid JWT token in the Authorization header.
    """
    return BaseResponse(
        success=True,
        message="User profile retrieved successfully.",
        data=current_user,
    )