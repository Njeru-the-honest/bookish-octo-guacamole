from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.schemas.feedback import FeedbackCreateSchema
from app.schemas.base import serialize_doc
from app.models.enums import SessionStatus
from app.utils.notifications import create_notification


async def create_feedback(
    student_id: str,
    data: FeedbackCreateSchema,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Student submits feedback for a completed session.

    Rules:
    - Session must exist.
    - Session must belong to the student.
    - Session must be completed.
    - Only one feedback entry per session.
    """
    if not ObjectId.is_valid(data.session_id):
        raise ValueError("Invalid session ID.")

    session = await db["sessions"].find_one({"_id": ObjectId(data.session_id)})
    if not session:
        raise ValueError("Session not found.")

    if session["student_id"] != student_id:
        raise ValueError("You are not authorized to leave feedback for this session.")

    if session["status"] != SessionStatus.completed.value:
        raise ValueError("Feedback can only be submitted for completed sessions.")

    existing_feedback = await db["feedback"].find_one({"session_id": data.session_id})
    if existing_feedback:
        raise ValueError("Feedback has already been submitted for this session.")

    now = datetime.utcnow()

    feedback_doc = {
        "session_id": data.session_id,
        "student_id": student_id,
        "tutor_id": session["tutor_id"],
        "rating": data.rating,
        "comment": data.comment,
        "created_at": now,
        "updated_at": now,
    }

    result = await db["feedback"].insert_one(feedback_doc)
    feedback_doc["_id"] = result.inserted_id

    await recalculate_tutor_rating(
        tutor_id=session["tutor_id"],
        db=db,
    )

    await create_notification(
        db=db,
        user_id=session["tutor_id"],
        title="New Feedback Received",
        message=(
            f"You received new feedback for your session on "
            f"{session['session_date']}."
        ),
    )

    return serialize_doc(feedback_doc)


async def recalculate_tutor_rating(
    tutor_id: str,
    db: AsyncIOMotorDatabase,
) -> None:
    """
    Recalculate and persist average_rating and total_reviews
    in tutor_profiles for a given tutor.
    """
    feedback_items = await db["feedback"].find({"tutor_id": tutor_id}).to_list(length=10000)

    total_reviews = len(feedback_items)
    average_rating = 0.0

    if total_reviews > 0:
        average_rating = sum(item["rating"] for item in feedback_items) / total_reviews

    await db["tutor_profiles"].update_one(
        {"user_id": tutor_id},
        {"$set": {
            "average_rating": round(average_rating, 2),
            "total_reviews": total_reviews,
            "updated_at": datetime.utcnow(),
        }}
    )


async def get_feedback_for_student(
    student_id: str,
    db: AsyncIOMotorDatabase,
) -> list:
    cursor = db["feedback"].find({"student_id": student_id}).sort("created_at", -1)
    items = await cursor.to_list(length=100)
    return [serialize_doc(item) for item in items]


async def get_feedback_for_tutor(
    tutor_id: str,
    db: AsyncIOMotorDatabase,
) -> list:
    cursor = db["feedback"].find({"tutor_id": tutor_id}).sort("created_at", -1)
    items = await cursor.to_list(length=200)
    return [serialize_doc(item) for item in items]


async def get_feedback_by_session_id(
    session_id: str,
    db: AsyncIOMotorDatabase,
) -> Optional[dict]:
    if not ObjectId.is_valid(session_id):
        return None

    item = await db["feedback"].find_one({"session_id": session_id})
    if not item:
        return None

    return serialize_doc(item)


async def get_all_feedback(
    db: AsyncIOMotorDatabase,
) -> list:
    cursor = db["feedback"].find({}).sort("created_at", -1)
    items = await cursor.to_list(length=500)
    return [serialize_doc(item) for item in items]