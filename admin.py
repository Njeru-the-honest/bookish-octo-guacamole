from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database
from app.schemas.base import BaseResponse
from app.core.dependencies import require_admin
from app.services.admin_service import (
    get_dashboard_stats,
    get_recent_sessions,
    get_recent_requests,
    get_recent_feedback,
    get_top_tutors,
    get_subject_demand,
)

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get(
    "/dashboard",
    response_model=BaseResponse,
    summary="Get admin dashboard summary statistics",
)
async def admin_dashboard(
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns a full summary of system metrics for the admin dashboard.

    Includes:
    - User counts broken down by role
    - Tutor application counts by status
    - Tutoring request counts by status
    - Session counts by status
    - System-wide average tutor rating
    - Total feedback and attendance log counts
    """
    stats = await get_dashboard_stats(db=db)
    return BaseResponse(
        success=True,
        message="Dashboard statistics retrieved successfully.",
        data=stats,
    )


@router.get(
    "/reports/sessions",
    response_model=BaseResponse,
    summary="Get recent sessions report (admin only)",
)
async def recent_sessions_report(
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Number of recent sessions to return"
    ),
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the most recently created tutoring sessions.
    Useful for monitoring recent system activity.
    """
    sessions = await get_recent_sessions(db=db, limit=limit)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(sessions)} recent session(s).",
        data=sessions,
    )


@router.get(
    "/reports/requests",
    response_model=BaseResponse,
    summary="Get recent tutoring requests report (admin only)",
)
async def recent_requests_report(
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Number of recent requests to return"
    ),
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the most recently created tutoring requests.
    Useful for monitoring student activity.
    """
    requests = await get_recent_requests(db=db, limit=limit)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(requests)} recent request(s).",
        data=requests,
    )


@router.get(
    "/reports/feedback",
    response_model=BaseResponse,
    summary="Get recent feedback report (admin only)",
)
async def recent_feedback_report(
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Number of recent feedback records to return"
    ),
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the most recently submitted feedback records.
    Useful for monitoring tutor quality and student satisfaction.
    """
    feedback_list = await get_recent_feedback(db=db, limit=limit)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(feedback_list)} recent feedback record(s).",
        data=feedback_list,
    )


@router.get(
    "/reports/top-tutors",
    response_model=BaseResponse,
    summary="Get top rated tutors (admin only)",
)
async def top_tutors_report(
    limit: int = Query(
        default=5,
        ge=1,
        le=20,
        description="Number of top tutors to return"
    ),
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the highest-rated approved tutors in the system.
    Only tutors with at least one review are included.
    Enriched with user name and department info.
    """
    tutors = await get_top_tutors(db=db, limit=limit)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(tutors)} top tutor(s).",
        data=tutors,
    )


@router.get(
    "/reports/subject-demand",
    response_model=BaseResponse,
    summary="Get subject demand report (admin only)",
)
async def subject_demand_report(
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns the top 10 most requested subjects.
    Shows total requests, accepted, and pending counts per subject.
    Useful for understanding tutoring demand across the university.
    """
    demand = await get_subject_demand(db=db)
    return BaseResponse(
        success=True,
        message=f"Retrieved demand data for {len(demand)} subject(s).",
        data=demand,
    )