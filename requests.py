from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.db.mongodb import get_database
from app.schemas.request import (
    TutoringRequestCreateSchema,
    TutoringRequestUpdateSchema,
)
from app.schemas.base import BaseResponse
from app.core.dependencies import (
    get_current_user,
    require_student,
    require_tutor,
    require_admin,
)
from app.services.request_service import (
    create_tutoring_request,
    get_requests_for_student,
    get_requests_for_tutor,
    get_all_requests,
    get_request_by_id,
    tutor_respond_to_request,
    student_cancel_request,
)

router = APIRouter(prefix="/requests", tags=["Tutoring Requests"])


# ─── Student Endpoints ────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=BaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a tutoring request (student only)",
)
async def create_request(
    data: TutoringRequestCreateSchema,
    current_user: dict = Depends(require_student),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Student submits a tutoring request to an approved tutor.

    - The tutor must be approved.
    - Duplicate pending requests to the same tutor
      for the same subject are not allowed.
    - preferred_date format: YYYY-MM-DD
    - preferred_time format: HH:MM
    """
    try:
        request = await create_tutoring_request(
            student_id=current_user["id"],
            data=data,
            db=db,
        )
        return BaseResponse(
            success=True,
            message="Tutoring request submitted successfully.",
            data=request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/my",
    response_model=BaseResponse,
    summary="Get my tutoring requests (student only)",
)
async def get_my_requests_as_student(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status: pending, accepted, rejected, cancelled"
    ),
    current_user: dict = Depends(require_student),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns all tutoring requests made by the currently
    authenticated student. Optionally filter by status.
    """
    requests = await get_requests_for_student(
        student_id=current_user["id"],
        db=db,
        status=status,
    )
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(requests)} request(s).",
        data=requests,
    )


@router.patch(
    "/{request_id}/cancel",
    response_model=BaseResponse,
    summary="Cancel a tutoring request (student only)",
)
async def cancel_my_request(
    request_id: str,
    current_user: dict = Depends(require_student),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Student cancels one of their own pending tutoring requests.
    Only pending requests can be cancelled.
    """
    try:
        updated_request = await student_cancel_request(
            request_id=request_id,
            student_id=current_user["id"],
            db=db,
        )
        return BaseResponse(
            success=True,
            message="Tutoring request cancelled successfully.",
            data=updated_request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── Tutor Endpoints ──────────────────────────────────────────────────────────

@router.get(
    "/incoming",
    response_model=BaseResponse,
    summary="Get incoming tutoring requests (tutor only)",
)
async def get_incoming_requests(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status: pending, accepted, rejected, cancelled"
    ),
    current_user: dict = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Returns all tutoring requests sent to the currently
    authenticated tutor. Optionally filter by status.
    """
    requests = await get_requests_for_tutor(
        tutor_id=current_user["id"],
        db=db,
        status=status,
    )
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(requests)} request(s).",
        data=requests,
    )


@router.patch(
    "/{request_id}/respond",
    response_model=BaseResponse,
    summary="Accept or reject a tutoring request (tutor only)",
)
async def respond_to_request(
    request_id: str,
    data: TutoringRequestUpdateSchema,
    current_user: dict = Depends(require_tutor),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Tutor accepts or rejects an incoming tutoring request.

    - Only the tutor the request was sent to can respond.
    - Only pending requests can be responded to.
    - Allowed status values: accepted, rejected.
    - Student is notified of the tutor's decision.
    """
    try:
        updated_request = await tutor_respond_to_request(
            request_id=request_id,
            tutor_id=current_user["id"],
            data=data,
            db=db,
        )
        return BaseResponse(
            success=True,
            message=f"Request {data.status.value} successfully.",
            data=updated_request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


# ─── Shared Endpoints ─────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=BaseResponse,
    summary="List all tutoring requests (admin only)",
)
async def list_all_requests(
    status: Optional[str] = Query(
        default=None,
        description="Filter by status: pending, accepted, rejected, cancelled"
    ),
    current_user: dict = Depends(require_admin),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Admin endpoint to list all tutoring requests in the system.
    Optionally filter by status.
    """
    requests = await get_all_requests(db=db, status=status)
    return BaseResponse(
        success=True,
        message=f"Retrieved {len(requests)} request(s).",
        data=requests,
    )


@router.get(
    "/{request_id}",
    response_model=BaseResponse,
    summary="Get a single tutoring request by ID",
)
async def get_single_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    """
    Fetch a single tutoring request by its ID.
    The request must belong to the current user
    (as student or tutor) unless the user is an admin.
    """
    request = await get_request_by_id(
        request_id=request_id,
        db=db,
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tutoring request not found.",
        )

    # Access control: only involved parties or admin can view
    user_id = current_user["id"]
    user_role = current_user["role"]

    if user_role != "admin":
        if request["student_id"] != user_id and request["tutor_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this request.",
            )

    return BaseResponse(
        success=True,
        message="Tutoring request retrieved successfully.",
        data=request,
    )