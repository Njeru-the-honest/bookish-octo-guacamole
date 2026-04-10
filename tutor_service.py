from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.schemas.tutor import (
    TutorApplicationCreateSchema,
    TutorApplicationReviewSchema,
)
from app.schemas.base import serialize_doc
from app.models.enums import TutorApplicationStatus
from app.utils.notifications import create_notification


async def submit_tutor_application(
    user_id: str,
    data: TutorApplicationCreateSchema,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Submit a tutor application for a student user.

    Rules:
    - A user can only have one pending or approved application at a time.
    - Rejected users may reapply.
    """
    # Check for existing active application
    existing = await db["tutor_applications"].find_one({
        "user_id": user_id,
        "status": {"$in": ["pending", "approved"]}
    })

    if existing:
        raise ValueError(
            "You already have a pending or approved tutor application."
        )

    now = datetime.utcnow()

    application_doc = {
        "user_id": user_id,
        "subjects": data.subjects,
        "bio": data.bio,
        "availability": data.availability,
        "status": TutorApplicationStatus.pending.value,
        "reviewed_by": None,
        "review_notes": None,
        "created_at": now,
        "updated_at": now,
    }

    result = await db["tutor_applications"].insert_one(application_doc)
    application_doc["_id"] = result.inserted_id

    return serialize_doc(application_doc)


async def get_all_applications(
    db: AsyncIOMotorDatabase,
    status: Optional[str] = None
) -> list:
    """
    Fetch all tutor applications.
    Optionally filter by status (pending, approved, rejected).
    """
    query = {}
    if status:
        query["status"] = status

    cursor = db["tutor_applications"].find(query).sort("created_at", -1)
    applications = await cursor.to_list(length=100)
    return [serialize_doc(a) for a in applications]


async def get_application_by_id(
    application_id: str,
    db: AsyncIOMotorDatabase
) -> Optional[dict]:
    """Fetch a single tutor application by its ID."""
    if not ObjectId.is_valid(application_id):
        return None

    application = await db["tutor_applications"].find_one(
        {"_id": ObjectId(application_id)}
    )
    if not application:
        return None

    return serialize_doc(application)


async def get_my_application(
    user_id: str,
    db: AsyncIOMotorDatabase
) -> Optional[dict]:
    """Fetch the current user's most recent tutor application."""
    application = await db["tutor_applications"].find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    if not application:
        return None

    return serialize_doc(application)


async def review_tutor_application(
    application_id: str,
    admin_id: str,
    data: TutorApplicationReviewSchema,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Admin approves or rejects a tutor application.

    On approval:
    - Application status is set to 'approved'
    - User role is updated to 'tutor'
    - A TutorProfile document is created
    - A notification is sent to the applicant

    On rejection:
    - Application status is set to 'rejected'
    - A notification is sent to the applicant
    """
    if not ObjectId.is_valid(application_id):
        raise ValueError("Invalid application ID.")

    application = await db["tutor_applications"].find_one(
        {"_id": ObjectId(application_id)}
    )

    if not application:
        raise ValueError("Tutor application not found.")

    if application["status"] != TutorApplicationStatus.pending.value:
        raise ValueError(
            f"This application has already been "
            f"{application['status']}."
        )

    now = datetime.utcnow()
    new_status = data.status.value

    # Update the application document
    await db["tutor_applications"].update_one(
        {"_id": ObjectId(application_id)},
        {"$set": {
            "status": new_status,
            "reviewed_by": admin_id,
            "review_notes": data.review_notes,
            "updated_at": now,
        }}
    )

    applicant_user_id = application["user_id"]

    if new_status == TutorApplicationStatus.approved.value:
        # Promote user role to 'tutor'
        await db["users"].update_one(
            {"_id": ObjectId(applicant_user_id)},
            {"$set": {
                "role": "tutor",
                "updated_at": now,
            }}
        )

        # Check if tutor profile already exists
        existing_profile = await db["tutor_profiles"].find_one(
            {"user_id": applicant_user_id}
        )

        if not existing_profile:
            # Create tutor profile
            tutor_profile_doc = {
                "user_id": applicant_user_id,
                "subjects": application["subjects"],
                "bio": application["bio"],
                "availability": application["availability"],
                "average_rating": 0.0,
                "total_reviews": 0,
                "is_approved": True,
                "created_at": now,
                "updated_at": now,
            }
            await db["tutor_profiles"].insert_one(tutor_profile_doc)

        # Notify the user
        await create_notification(
            db=db,
            user_id=applicant_user_id,
            title="Tutor Application Approved",
            message=(
                "Congratulations! Your tutor application has been approved. "
                "You can now accept tutoring requests from students."
            ),
        )

    else:
        # Notify the user of rejection
        await create_notification(
            db=db,
            user_id=applicant_user_id,
            title="Tutor Application Rejected",
            message=(
                f"Your tutor application was not approved. "
                f"Reason: {data.review_notes or 'No reason provided.'} "
                f"You may reapply after addressing the feedback."
            ),
        )

    # Return updated application
    updated = await db["tutor_applications"].find_one(
        {"_id": ObjectId(application_id)}
    )
    return serialize_doc(updated)


async def get_approved_tutors(
    db: AsyncIOMotorDatabase,
    subject: Optional[str] = None
) -> list:
    """
    Fetch all approved tutor profiles.
    Optionally filter by subject (case-insensitive partial match).
    Joins with user collection to include full_name and school_or_department.
    """
    query = {"is_approved": True}

    if subject:
        query["subjects"] = {
            "$elemMatch": {
                "$regex": subject,
                "$options": "i"
            }
        }

    cursor = db["tutor_profiles"].find(query).sort("average_rating", -1)
    profiles = await cursor.to_list(length=100)

    result = []
    for profile in profiles:
        serialized = serialize_doc(profile)

        # Fetch user info to enrich the profile
        if ObjectId.is_valid(serialized["user_id"]):
            user = await db["users"].find_one(
                {"_id": ObjectId(serialized["user_id"])}
            )
            if user:
                serialized["full_name"] = user.get("full_name", "")
                serialized["school_or_department"] = user.get(
                    "school_or_department", ""
                )

        result.append(serialized)

    return result


async def get_tutor_profile_by_user_id(
    user_id: str,
    db: AsyncIOMotorDatabase
) -> Optional[dict]:
    """Fetch a tutor profile by the user's ID."""
    profile = await db["tutor_profiles"].find_one({"user_id": user_id})
    if not profile:
        return None
    return serialize_doc(profile)


async def update_tutor_profile(
    user_id: str,
    update_data: dict,
    db: AsyncIOMotorDatabase
) -> Optional[dict]:
    """
    Update a tutor's own profile fields.
    Only updates fields that are explicitly provided.
    """
    update_data["updated_at"] = datetime.utcnow()

    await db["tutor_profiles"].update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )

    return await get_tutor_profile_by_user_id(user_id, db)