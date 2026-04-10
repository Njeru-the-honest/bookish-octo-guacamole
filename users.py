from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.schemas.user import UserUpdateSchema
from app.schemas.base import BaseResponse
from app.core.dependencies import get_current_user, require_admin
from app.services.user_service import (
    get_user_profile,
    update_user_profile,
    get_all_users,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/me",
    response_model=BaseResponse,
    summary="Get my profile",
)
async def get_my_profile(
    current_user: dict = Depends(get_current_user),
):
    """
    Returns the full profile of the currently authenticated user.
    """
    return BaseResponse(
        success=True,
        message="Profile retrieved successfully.",
        data=current_user,
    )


@router.put(
    "/me",
    response_model=BaseResponse,
    summary="Update my profile",
)
async def update_my_profile(
    data: UserUpdateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Update the current user's profile.
    Only full_name, school_or_department, and year_of_study can be updated.
    """
    updated_user = await update_user_profile(
        user_id=current_user["id"],
        data=data,
        db=db,
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return BaseResponse(
        success=True,
        message="Profile updated successfully.",
        data=updated_user,
    )


@router.get(
    "/",
    response_model=BaseResponse,
    summary="List all users (admin only)",
)
async def list_all_users(
    role: str = None,
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Admin endpoint to list all users.
    Optionally filter by role: student, tutor, admin.
    """
    users = await get_all_users(db=db, role=role)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(users)} user(s).",
        data=users,
    )


@router.get(
    "/{user_id}",
    response_model=BaseResponse,
    summary="Get a user by ID (admin only)",
)
async def get_user_by_id_route(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Admin endpoint to fetch any user's profile by their ID.
    """
    user = await get_user_profile(user_id=user_id, db=db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return BaseResponse(
        success=True,
        message="User retrieved successfully.",
        data=user,
    )