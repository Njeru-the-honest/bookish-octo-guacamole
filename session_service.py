from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.schemas.session import (
    SessionCreateSchema,
    SessionStatusUpdateSchema,
)
from app.schemas.base import serialize_doc
from app.models.enums import (
    SessionStatus,
    TutoringRequestStatus,
    AttendanceStatus,
)
from app.utils.notifications import create_notification


async def create_session(
    tutor_id: str,
    data: SessionCreateSchema,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Create a tutoring session from an accepted tutoring request.

    Rules:
    - The tutoring request must exist and be in 'accepted' status.
    - Only the tutor who owns the request can create the session.
    - A session cannot already exist for the same request.
    - Basic scheduling conflict check: tutor cannot have two sessions
      on the same date and overlapping start time.
    """
    if not ObjectId.is_valid(data.tutoring_request_id):
        raise ValueError("Invalid tutoring request ID.")

    tutoring_request = await db["tutoring_requests"].find_one(
        {"_id": ObjectId(data.tutoring_request_id)}
    )

    if not tutoring_request:
        raise ValueError("Tutoring request not found.")

    if tutoring_request["tutor_id"] != tutor_id:
        raise ValueError(
            "You are not authorized to create a session "
            "for this tutoring request."
        )

    if tutoring_request["status"] != TutoringRequestStatus.accepted.value:
        raise ValueError(
            "A session can only be created from an accepted "
            f"tutoring request. Current status: "
            f"'{tutoring_request['status']}'."
        )

    existing_session = await db["sessions"].find_one(
        {"tutoring_request_id": data.tutoring_request_id}
    )

    if existing_session:
        raise ValueError(
            "A session already exists for this tutoring request."
        )

    conflict = await db["sessions"].find_one({
        "tutor_id": tutor_id,
        "session_date": data.session_date,
        "start_time": data.start_time,
        "status": {"$in": [
            SessionStatus.scheduled.value,
            SessionStatus.in_progress.value,
        ]},
    })

    if conflict:
        raise ValueError(
            f"You already have a session scheduled on "
            f"{data.session_date} at {data.start_time}. "
            f"Please choose a different time."
        )

    now = datetime.utcnow()

    session_doc = {
        "tutoring_request_id": data.tutoring_request_id,
        "tutor_id": tutor_id,
        "student_id": tutoring_request["student_id"],
        "subject": tutoring_request["subject"],
        "session_date": data.session_date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "duration_minutes": data.duration_minutes,
        "status": SessionStatus.scheduled.value,
        "created_at": now,
        "updated_at": now,
    }

    result = await db["sessions"].insert_one(session_doc)
    session_doc["_id"] = result.inserted_id

    student_id = tutoring_request["student_id"]
    subject = tutoring_request["subject"]

    await create_notification(
        db=db,
        user_id=student_id,
        title="Session Scheduled",
        message=(
            f"Your tutoring session for '{subject}' has been scheduled "
            f"on {data.session_date} at {data.start_time}. "
            f"Please be on time."
        ),
    )

    return serialize_doc(session_doc)


async def get_sessions_for_student(
    student_id: str,
    db: AsyncIOMotorDatabase,
    status: Optional[str] = None,
) -> list:
    query = {"student_id": student_id}
    if status:
        query["status"] = status

    cursor = db["sessions"].find(query).sort("session_date", -1)
    sessions = await cursor.to_list(length=100)
    return [serialize_doc(s) for s in sessions]


async def get_sessions_for_tutor(
    tutor_id: str,
    db: AsyncIOMotorDatabase,
    status: Optional[str] = None,
) -> list:
    query = {"tutor_id": tutor_id}
    if status:
        query["status"] = status

    cursor = db["sessions"].find(query).sort("session_date", -1)
    sessions = await cursor.to_list(length=100)
    return [serialize_doc(s) for s in sessions]


async def get_all_sessions(
    db: AsyncIOMotorDatabase,
    status: Optional[str] = None,
) -> list:
    query = {}
    if status:
        query["status"] = status

    cursor = db["sessions"].find(query).sort("session_date", -1)
    sessions = await cursor.to_list(length=200)
    return [serialize_doc(s) for s in sessions]


async def get_session_by_id(
    session_id: str,
    db: AsyncIOMotorDatabase,
) -> Optional[dict]:
    if not ObjectId.is_valid(session_id):
        return None

    session = await db["sessions"].find_one(
        {"_id": ObjectId(session_id)}
    )
    if not session:
        return None

    return serialize_doc(session)


async def update_session_status(
    session_id: str,
    requesting_user_id: str,
    requesting_user_role: str,
    data: SessionStatusUpdateSchema,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Update the status of a session.

    Allowed transitions:
    - scheduled     → in_progress  (tutor only)
    - scheduled     → cancelled    (tutor or admin)
    - in_progress   → completed    (tutor only, after attendance)
    - in_progress   → cancelled    (tutor or admin)
    """
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session ID.")

    session = await db["sessions"].find_one(
        {"_id": ObjectId(session_id)}
    )

    if not session:
        raise ValueError("Session not found.")

    current_status = session["status"]
    new_status = data.status.value

    if requesting_user_role == "tutor":
        if session["tutor_id"] != requesting_user_id:
            raise ValueError(
                "You are not authorized to update this session."
            )
    elif requesting_user_role != "admin":
        raise ValueError(
            "Only tutors or admins can update session status."
        )

    if current_status in [
        SessionStatus.completed.value,
        SessionStatus.cancelled.value,
    ]:
        raise ValueError(
            f"Cannot update a session that is already "
            f"'{current_status}'."
        )

    allowed_transitions = {
        SessionStatus.scheduled.value: [
            SessionStatus.in_progress.value,
            SessionStatus.cancelled.value,
        ],
        SessionStatus.in_progress.value: [
            SessionStatus.completed.value,
            SessionStatus.cancelled.value,
        ],
    }

    allowed = allowed_transitions.get(current_status, [])
    if new_status not in allowed:
        raise ValueError(
            f"Cannot transition session from '{current_status}' "
            f"to '{new_status}'. "
            f"Allowed transitions: {allowed}."
        )

    if current_status == SessionStatus.in_progress.value and new_status == SessionStatus.completed.value:
        attendance = await db["attendance"].find_one({"session_id": session_id})

        if not attendance:
            raise ValueError("Attendance must be recorded before completing the session.")

        if attendance["student_attendance"] == AttendanceStatus.pending.value:
            raise ValueError("Student attendance must be marked before completing the session.")

    now = datetime.utcnow()

    update_fields = {
        "status": new_status,
        "updated_at": now,
    }

    await db["sessions"].update_one(
        {"_id": ObjectId(session_id)},
        {"$set": update_fields}
    )

    student_id = session["student_id"]
    subject = session["subject"]
    session_date = session["session_date"]
    start_time = session["start_time"]

    notification_messages = {
        SessionStatus.in_progress.value: (
            f"Your tutoring session for '{subject}' on "
            f"{session_date} at {start_time} has started. "
            f"Good luck!"
        ),
        SessionStatus.completed.value: (
            f"Your tutoring session for '{subject}' on "
            f"{session_date} has been completed. "
            f"Please leave feedback for your tutor."
        ),
        SessionStatus.cancelled.value: (
            f"Your tutoring session for '{subject}' on "
            f"{session_date} at {start_time} has been cancelled."
        ),
    }

    message = notification_messages.get(new_status)
    if message:
        await create_notification(
            db=db,
            user_id=student_id,
            title=f"Session {new_status.replace('_', ' ').title()}",
            message=message,
        )

    updated_session = await db["sessions"].find_one(
        {"_id": ObjectId(session_id)}
    )
    return serialize_doc(updated_session)