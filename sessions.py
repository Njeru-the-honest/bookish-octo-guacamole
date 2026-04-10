from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.db.mongodb import get_database
from app.schemas.session import (
    SessionCreateSchema,
    SessionStatusUpdateSchema,
)
from app.schemas.base import BaseResponse
from app.core.dependencies import (
    get_current_user,
    require_tutor,
    require_admin,
)
from app.services.session_service import (
    create_session,
    get_sessions_for_student,
    get_sessions_for_tutor,
    get_all_sessions,
    get_session_by_id,
    update_session_status,
)

router = APIRouter(prefix="/sessions", tags=["Sessions"])


# ─── Tutor Endpoints ──────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=BaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a session from an accepted request (tutor only)",
)
async def create_new_session(
    data: SessionCreateSchema,
    current_user: dict = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Tutor creates a tutoring session from an accepted tutoring request.

    Rules:
    - The tutoring request must be in 'accepted' status.
    - Only the tutor who owns the request can create the session.
    - A session cannot already exist for the same request.
    - Tutor cannot have two sessions at the same date and start time.
    - session_date format: YYYY-MM-DD
    - start_time / end_time format: HH:MM
    """
    try:
        session = await create_session(
            tutor_id=current_user["id"],
            data=data,
            db=db,
        )
        return BaseResponse(
            success=True,
            message="Session created and scheduled successfully.",
            data=session,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── Shared Endpoints (role-aware) ───────────────────────────────────────────

@router.get(
    "/my",
    response_model=BaseResponse,
    summary="Get my sessions (tutor or student)",
)
async def get_my_sessions(
    status: Optional[str] = Query(
        default=None,
        description=(
            "Filter by status: scheduled, in_progress, "
            "completed, cancelled"
        )
    ),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns sessions for the currently authenticated user.

    - If the user is a **tutor**: returns sessions where they are the tutor.
    - If the user is a **student**: returns sessions where they are the student.
    - Optionally filter by session status.
    """
    user_role = current_user["role"]
    user_id = current_user["id"]

    if user_role == "tutor":
        sessions = await get_sessions_for_tutor(
            tutor_id=user_id,
            db=db,
            status=status,
        )
    elif user_role == "student":
        sessions = await get_sessions_for_student(
            student_id=user_id,
            db=db,
            status=status,
        )
    else:
        # Admin calling /my — return empty, they should use /all
        sessions = []

    return BaseResponse(
        success=True,
        message=f"Retrieved {len(sessions)} session(s).",
        data=sessions,
    )


@router.patch(
    "/{session_id}/status",
    response_model=BaseResponse,
    summary="Update session status (tutor or admin)",
)
async def update_status(
    session_id: str,
    data: SessionStatusUpdateSchema,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Update the status of a tutoring session.

    Allowed transitions:
    - **scheduled** → in_progress (tutor only)
    - **scheduled** → cancelled   (tutor or admin)
    - **in_progress** → completed (tutor only)
    - **in_progress** → cancelled (tutor or admin)

    Completed and cancelled sessions cannot be changed.
    """
    user_role = current_user["role"]

    if user_role not in ["tutor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tutors or admins can update session status.",
        )

    try:
        updated_session = await update_session_status(
            session_id=session_id,
            requesting_user_id=current_user["id"],
            requesting_user_role=user_role,
            data=data,
            db=db,
        )
        return BaseResponse(
            success=True,
            message=(
                f"Session status updated to "
                f"'{data.status.value}' successfully."
            ),
            data=updated_session,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── Admin Endpoints ──────────────────────────────────────────────────────────

@router.get(
    "/all",
    response_model=BaseResponse,
    summary="List all sessions (admin only)",
)
async def list_all_sessions(
    status: Optional[str] = Query(
        default=None,
        description=(
            "Filter by status: scheduled, in_progress, "
            "completed, cancelled"
        )
    ),
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Admin endpoint to list all sessions in the system.
    Optionally filter by session status.
    """
    sessions = await get_all_sessions(db=db, status=status)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(sessions)} session(s).",
        data=sessions,
    )


# ─── Single Session Endpoint ──────────────────────────────────────────────────

@router.get(
    "/{session_id}",
    response_model=BaseResponse,
    summary="Get a single session by ID",
)
async def get_single_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Fetch a single session by its ID.

    Access control:
    - Students can only view sessions they are part of.
    - Tutors can only view sessions they are part of.
    - Admins can view any session.
    """
    session = await get_session_by_id(
        session_id=session_id,
        db=db,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    # Access control
    user_id = current_user["id"]
    user_role = current_user["role"]

    if user_role != "admin":
        if (
            session["student_id"] != user_id
            and session["tutor_id"] != user_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this session.",
            )

    return BaseResponse(
        success=True,
        message="Session retrieved successfully.",
        data=session,
    )