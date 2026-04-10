from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.schemas.attendance import AttendanceUpdateSchema
from app.schemas.base import serialize_doc
from app.models.enums import AttendanceStatus
from app.utils.notifications import create_notification


async def get_attendance_by_session_id(
    session_id: str,
    db: AsyncIOMotorDatabase,
) -> Optional[dict]:
    if not ObjectId.is_valid(session_id):
        return None

    attendance = await db["attendance"].find_one({"session_id": session_id})
    if not attendance:
        return None

    return serialize_doc(attendance)


async def create_attendance_for_session(
    session_id: str,
    requesting_user_id: str,
    requesting_user_role: str,
    notes: Optional[str],
    db: AsyncIOMotorDatabase,
) -> dict:
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session ID.")

    session = await db["sessions"].find_one({"_id": ObjectId(session_id)})
    if not session:
        raise ValueError("Session not found.")

    if requesting_user_role == "tutor":
        if session["tutor_id"] != requesting_user_id:
            raise ValueError("Not authorized.")
    elif requesting_user_role != "admin":
        raise ValueError("Only tutor or admin allowed.")

    existing = await db["attendance"].find_one({"session_id": session_id})
    if existing:
        raise ValueError("Attendance already exists.")

    now = datetime.utcnow()

    attendance_doc = {
        "session_id": session_id,
        "student_id": session["student_id"],
        "tutor_id": session["tutor_id"],
        "tutor_attendance": AttendanceStatus.present.value,
        "student_attendance": AttendanceStatus.pending.value,
        "notes": notes,
        "recorded_by": requesting_user_id,
        "created_at": now,
        "updated_at": now,
    }

    result = await db["attendance"].insert_one(attendance_doc)
    attendance_doc["_id"] = result.inserted_id

    return serialize_doc(attendance_doc)


async def update_attendance_for_session(
    session_id: str,
    requesting_user_id: str,
    requesting_user_role: str,
    data: AttendanceUpdateSchema,
    db: AsyncIOMotorDatabase,
) -> dict:
    if not ObjectId.is_valid(session_id):
        raise ValueError("Invalid session ID.")

    session = await db["sessions"].find_one({"_id": ObjectId(session_id)})
    if not session:
        raise ValueError("Session not found.")

    if requesting_user_role == "tutor":
        if session["tutor_id"] != requesting_user_id:
            raise ValueError("Not authorized.")
    elif requesting_user_role != "admin":
        raise ValueError("Only tutor or admin allowed.")

    attendance = await db["attendance"].find_one({"session_id": session_id})
    if not attendance:
        raise ValueError("Attendance does not exist.")

    now = datetime.utcnow()

    await db["attendance"].update_one(
        {"session_id": session_id},
        {"$set": {
            "tutor_attendance": data.tutor_attendance.value,
            "student_attendance": data.student_attendance.value,
            "notes": data.notes,
            "recorded_by": requesting_user_id,
            "updated_at": now,
        }}
    )

    updated = await db["attendance"].find_one({"session_id": session_id})

    await create_notification(
        db=db,
        user_id=session["student_id"],
        title="Attendance Recorded",
        message="Attendance has been recorded for your session.",
    )

    return serialize_doc(updated)


async def get_my_attendance(
    current_user_id: str,
    current_user_role: str,
    db: AsyncIOMotorDatabase,
) -> list:
    if current_user_role == "student":
        query = {"student_id": current_user_id}
    elif current_user_role == "tutor":
        query = {"tutor_id": current_user_id}
    else:
        return []

    cursor = db["attendance"].find(query)
    items = await cursor.to_list(length=100)
    return [serialize_doc(i) for i in items]


async def get_all_attendance(
    db: AsyncIOMotorDatabase,
) -> list:
    cursor = db["attendance"].find({})
    items = await cursor.to_list(length=200)
    return [serialize_doc(i) for i in items]