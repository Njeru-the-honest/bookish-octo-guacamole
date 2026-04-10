from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.schemas.request import (
    TutoringRequestCreateSchema,
    TutoringRequestUpdateSchema,
)
from app.schemas.base import serialize_doc
from app.models.enums import TutoringRequestStatus
from app.utils.notifications import create_notification


async def create_tutoring_request(
    student_id: str,
    data: TutoringRequestCreateSchema,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Create a new tutoring request from a student to a tutor.

    Rules:
    - The tutor must exist and be approved.
    - A student cannot send duplicate pending requests
      to the same tutor for the same subject.
    """
    # Verify tutor exists and is approved
    tutor_profile = await db["tutor_profiles"].find_one({
        "user_id": data.tutor_id,
        "is_approved": True,
    })

    if not tutor_profile:
        raise ValueError(
            "The selected tutor does not exist or is not approved."
        )

    # Check for duplicate pending request
    duplicate = await db["tutoring_requests"].find_one({
        "student_id": student_id,
        "tutor_id": data.tutor_id,
        "subject": data.subject,
        "status": TutoringRequestStatus.pending.value,
    })

    if duplicate:
        raise ValueError(
            "You already have a pending request to this tutor "
            "for the same subject."
        )

    now = datetime.utcnow()

    request_doc = {
        "student_id": student_id,
        "tutor_id": data.tutor_id,
        "subject": data.subject,
        "preferred_date": data.preferred_date,
        "preferred_time": data.preferred_time,
        "notes": data.notes,
        "status": TutoringRequestStatus.pending.value,
        "created_at": now,
        "updated_at": now,
    }

    result = await db["tutoring_requests"].insert_one(request_doc)
    request_doc["_id"] = result.inserted_id

    # Notify the tutor
    await create_notification(
        db=db,
        user_id=data.tutor_id,
        title="New Tutoring Request",
        message=(
            f"You have received a new tutoring request for "
            f"'{data.subject}' on {data.preferred_date} "
            f"at {data.preferred_time}."
        ),
    )

    return serialize_doc(request_doc)


async def get_requests_for_student(
    student_id: str,
    db: AsyncIOMotorDatabase,
    status: Optional[str] = None,
) -> list:
    """
    Fetch all tutoring requests made by a specific student.
    Optionally filter by status.
    """
    query = {"student_id": student_id}
    if status:
        query["status"] = status

    cursor = db["tutoring_requests"].find(query).sort("created_at", -1)
    requests = await cursor.to_list(length=100)
    return [serialize_doc(r) for r in requests]


async def get_requests_for_tutor(
    tutor_id: str,
    db: AsyncIOMotorDatabase,
    status: Optional[str] = None,
) -> list:
    """
    Fetch all tutoring requests sent to a specific tutor.
    Optionally filter by status.
    """
    query = {"tutor_id": tutor_id}
    if status:
        query["status"] = status

    cursor = db["tutoring_requests"].find(query).sort("created_at", -1)
    requests = await cursor.to_list(length=100)
    return [serialize_doc(r) for r in requests]


async def get_all_requests(
    db: AsyncIOMotorDatabase,
    status: Optional[str] = None,
) -> list:
    """
    Fetch all tutoring requests in the system.
    Used by admin. Optionally filter by status.
    """
    query = {}
    if status:
        query["status"] = status

    cursor = db["tutoring_requests"].find(query).sort("created_at", -1)
    requests = await cursor.to_list(length=200)
    return [serialize_doc(r) for r in requests]


async def get_request_by_id(
    request_id: str,
    db: AsyncIOMotorDatabase,
) -> Optional[dict]:
    """
    Fetch a single tutoring request by its ID.
    """
    if not ObjectId.is_valid(request_id):
        return None

    request = await db["tutoring_requests"].find_one(
        {"_id": ObjectId(request_id)}
    )
    if not request:
        return None

    return serialize_doc(request)


async def tutor_respond_to_request(
    request_id: str,
    tutor_id: str,
    data: TutoringRequestUpdateSchema,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Tutor accepts or rejects a tutoring request.

    Rules:
    - Only the tutor the request was sent to can respond.
    - Only pending requests can be accepted or rejected.
    - Accepted or rejected status values are allowed here.
    - On acceptance, a notification is sent to the student.
    - On rejection, a notification is sent to the student.
    """
    if not ObjectId.is_valid(request_id):
        raise ValueError("Invalid request ID.")

    request = await db["tutoring_requests"].find_one(
        {"_id": ObjectId(request_id)}
    )

    if not request:
        raise ValueError("Tutoring request not found.")

    # Ensure this tutor owns this request
    if request["tutor_id"] != tutor_id:
        raise ValueError(
            "You are not authorized to respond to this request."
        )

    # Only pending requests can be responded to
    if request["status"] != TutoringRequestStatus.pending.value:
        raise ValueError(
            f"This request has already been {request['status']}. "
            f"Only pending requests can be accepted or rejected."
        )

    # Validate the new status
    allowed_statuses = [
        TutoringRequestStatus.accepted.value,
        TutoringRequestStatus.rejected.value,
    ]
    if data.status.value not in allowed_statuses:
        raise ValueError(
            "Tutors can only accept or reject requests."
        )

    now = datetime.utcnow()

    await db["tutoring_requests"].update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": data.status.value,
            "updated_at": now,
        }}
    )

    student_id = request["student_id"]
    subject = request["subject"]
    preferred_date = request["preferred_date"]
    preferred_time = request["preferred_time"]

    # Notify the student
    if data.status.value == TutoringRequestStatus.accepted.value:
        await create_notification(
            db=db,
            user_id=student_id,
            title="Tutoring Request Accepted",
            message=(
                f"Your tutoring request for '{subject}' on "
                f"{preferred_date} at {preferred_time} has been accepted. "
                f"A session will be scheduled for you."
            ),
        )
    else:
        await create_notification(
            db=db,
            user_id=student_id,
            title="Tutoring Request Rejected",
            message=(
                f"Your tutoring request for '{subject}' on "
                f"{preferred_date} at {preferred_time} was not accepted. "
                f"You may request a different tutor."
            ),
        )

    updated_request = await db["tutoring_requests"].find_one(
        {"_id": ObjectId(request_id)}
    )
    return serialize_doc(updated_request)


async def student_cancel_request(
    request_id: str,
    student_id: str,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Student cancels their own tutoring request.

    Rules:
    - Only the student who created the request can cancel it.
    - Only pending requests can be cancelled.
    """
    if not ObjectId.is_valid(request_id):
        raise ValueError("Invalid request ID.")

    request = await db["tutoring_requests"].find_one(
        {"_id": ObjectId(request_id)}
    )

    if not request:
        raise ValueError("Tutoring request not found.")

    # Ensure this student owns this request
    if request["student_id"] != student_id:
        raise ValueError(
            "You are not authorized to cancel this request."
        )

    # Only pending requests can be cancelled
    if request["status"] != TutoringRequestStatus.pending.value:
        raise ValueError(
            f"Only pending requests can be cancelled. "
            f"This request is already '{request['status']}'."
        )

    now = datetime.utcnow()

    await db["tutoring_requests"].update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": TutoringRequestStatus.cancelled.value,
            "updated_at": now,
        }}
    )

    # Notify the tutor
    await create_notification(
        db=db,
        user_id=request["tutor_id"],
        title="Tutoring Request Cancelled",
        message=(
            f"A tutoring request for '{request['subject']}' on "
            f"{request['preferred_date']} at {request['preferred_time']} "
            f"has been cancelled by the student."
        ),
    )

    updated_request = await db["tutoring_requests"].find_one(
        {"_id": ObjectId(request_id)}
    )
    return serialize_doc(updated_request)