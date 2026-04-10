from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.db.mongodb import get_database
from app.schemas.tutor import (
    TutorApplicationCreateSchema,
    TutorApplicationReviewSchema,
    TutorProfileUpdateSchema,
)
from app.schemas.base import BaseResponse
from app.core.dependencies import (
    get_current_user,
    require_admin,
    require_tutor,
)
from app.services.tutor_service import (
    submit_tutor_application,
    get_all_applications,
    get_application_by_id,
    get_my_application,
    review_tutor_application,
    get_approved_tutors,
    get_tutor_profile_by_user_id,
    update_tutor_profile,
)

router = APIRouter(prefix="/tutors", tags=["Tutors"])


# ─── Tutor Application Endpoints ─────────────────────────────────────────────

@router.post(
    "/apply",
    response_model=BaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a tutor application",
)
async def apply_to_be_tutor(
    data: TutorApplicationCreateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Submit a tutor application.

    - Any registered user (student) can apply to become a tutor.
    - Only one active (pending or approved) application is allowed at a time.
    - Rejected applicants may reapply.
    """
    try:
        application = await submit_tutor_application(
            user_id=current_user["id"],
            data=data,
            db=db,
        )
        return BaseResponse(
            success=True,
            message="Tutor application submitted successfully. "
                    "Please wait for admin review.",
            data=application,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/apply/me",
    response_model=BaseResponse,
    summary="Get my tutor application status",
)
async def get_my_tutor_application(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the current user's most recent tutor application.
    Useful for students to check their application status.
    """
    application = await get_my_application(
        user_id=current_user["id"],
        db=db,
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You have not submitted a tutor application yet.",
        )

    return BaseResponse(
        success=True,
        message="Application retrieved successfully.",
        data=application,
    )


# ─── Admin Application Management Endpoints ──────────────────────────────────

@router.get(
    "/applications",
    response_model=BaseResponse,
    summary="List all tutor applications (admin only)",
)
async def list_tutor_applications(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status: pending, approved, rejected"
    ),
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Admin endpoint to list all tutor applications.
    Optionally filter by status.
    """
    applications = await get_all_applications(db=db, status=status)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(applications)} application(s).",
        data=applications,
    )


@router.get(
    "/applications/{application_id}",
    response_model=BaseResponse,
    summary="Get a single tutor application (admin only)",
)
async def get_single_application(
    application_id: str,
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Admin endpoint to fetch a single tutor application by ID.
    """
    application = await get_application_by_id(
        application_id=application_id,
        db=db,
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    return BaseResponse(
        success=True,
        message="Application retrieved successfully.",
        data=application,
    )


@router.patch(
    "/applications/{application_id}/review",
    response_model=BaseResponse,
    summary="Approve or reject a tutor application (admin only)",
)
async def review_application(
    application_id: str,
    data: TutorApplicationReviewSchema,
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Admin endpoint to approve or reject a tutor application.

    - On **approval**: user role is promoted to 'tutor' and a tutor
      profile is automatically created.
    - On **rejection**: user remains a student and may reapply.
    - A notification is sent to the applicant in both cases.
    """
    try:
        updated_application = await review_tutor_application(
            application_id=application_id,
            admin_id=current_user["id"],
            data=data,
            db=db,
        )
        action = "approved" if data.status.value == "approved" else "rejected"
        return BaseResponse(
            success=True,
            message=f"Tutor application {action} successfully.",
            data=updated_application,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── Tutor Discovery Endpoints ────────────────────────────────────────────────

@router.get(
    "/approved",
    response_model=BaseResponse,
    summary="List all approved tutors",
)
async def list_approved_tutors(
    subject: Optional[str] = Query(
        default=None,
        description="Filter tutors by subject name (partial match)"
    ),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns a list of all approved tutors.
    Any authenticated user can browse approved tutors.
    Optionally filter by subject using a partial case-insensitive search.
    """
    tutors = await get_approved_tutors(db=db, subject=subject)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(tutors)} approved tutor(s).",
        data=tutors,
    )


@router.get(
    "/profile/me",
    response_model=BaseResponse,
    summary="Get my tutor profile",
)
async def get_my_tutor_profile(
    current_user: dict = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the tutor profile of the currently authenticated tutor.
    Only accessible by users with the 'tutor' role.
    """
    profile = await get_tutor_profile_by_user_id(
        user_id=current_user["id"],
        db=db,
    )

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor profile not found.",
        )

    return BaseResponse(
        success=True,
        message="Tutor profile retrieved successfully.",
        data=profile,
    )


@router.put(
    "/profile/me",
    response_model=BaseResponse,
    summary="Update my tutor profile",
)
async def update_my_tutor_profile(
    data: TutorProfileUpdateSchema,
    current_user: dict = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Allows an approved tutor to update their own profile.
    Updatable fields: subjects, bio, availability.
    """
    update_data = {
        k: v for k, v in data.model_dump().items()
        if v is not None
    }

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update.",
        )

    updated_profile = await update_tutor_profile(
        user_id=current_user["id"],
        update_data=update_data,
        db=db,
    )

    if not updated_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor profile not found.",
        )

    return BaseResponse(
        success=True,
        message="Tutor profile updated successfully.",
        data=updated_profile,
    )


@router.get(
    "/{user_id}",
    response_model=BaseResponse,
    summary="Get a tutor's public profile by user ID",
)
async def get_tutor_public_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the public profile of an approved tutor by their user ID.
    Any authenticated user can view a tutor's public profile.
    """
    profile = await get_tutor_profile_by_user_id(user_id=user_id, db=db)

    if not profile or not profile.get("is_approved"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutor profile not found.",
        )

    return BaseResponse(
        success=True,
        message="Tutor profile retrieved successfully.",
        data=profile,
    )