from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.base import serialize_doc


async def get_dashboard_stats(db: AsyncIOMotorDatabase) -> dict:
    """
    Aggregate and return all key system metrics for the admin dashboard.

    Includes:
    - User counts by role
    - Tutor application counts by status
    - Tutoring request counts by status
    - Session counts by status
    - Average tutor rating across the system
    - Total feedback count
    - Total attendance logs
    """

    # ── User Stats ────────────────────────────────────────────────────────────
    total_users = await db["users"].count_documents({})
    total_students = await db["users"].count_documents({"role": "student"})
    total_tutors = await db["users"].count_documents({"role": "tutor"})
    total_admins = await db["users"].count_documents({"role": "admin"})

    # ── Tutor Application Stats ───────────────────────────────────────────────
    total_applications = await db["tutor_applications"].count_documents({})
    pending_applications = await db["tutor_applications"].count_documents(
        {"status": "pending"}
    )
    approved_applications = await db["tutor_applications"].count_documents(
        {"status": "approved"}
    )
    rejected_applications = await db["tutor_applications"].count_documents(
        {"status": "rejected"}
    )

    # ── Tutoring Request Stats ────────────────────────────────────────────────
    total_requests = await db["tutoring_requests"].count_documents({})
    pending_requests = await db["tutoring_requests"].count_documents(
        {"status": "pending"}
    )
    accepted_requests = await db["tutoring_requests"].count_documents(
        {"status": "accepted"}
    )
    rejected_requests = await db["tutoring_requests"].count_documents(
        {"status": "rejected"}
    )
    cancelled_requests = await db["tutoring_requests"].count_documents(
        {"status": "cancelled"}
    )

    # ── Session Stats ─────────────────────────────────────────────────────────
    total_sessions = await db["sessions"].count_documents({})
    scheduled_sessions = await db["sessions"].count_documents(
        {"status": "scheduled"}
    )
    in_progress_sessions = await db["sessions"].count_documents(
        {"status": "in_progress"}
    )
    completed_sessions = await db["sessions"].count_documents(
        {"status": "completed"}
    )
    cancelled_sessions = await db["sessions"].count_documents(
        {"status": "cancelled"}
    )

    # ── Feedback & Rating Stats ───────────────────────────────────────────────
    total_feedback = await db["feedback"].count_documents({})

    # Calculate system-wide average rating using aggregation
    rating_pipeline = [
        {"$group": {
            "_id": None,
            "system_average_rating": {"$avg": "$rating"},
        }}
    ]
    rating_cursor = db["feedback"].aggregate(rating_pipeline)
    rating_results = await rating_cursor.to_list(length=1)

    system_average_rating = 0.0
    if rating_results:
        system_average_rating = round(
            rating_results[0]["system_average_rating"], 2
        )

    # ── Attendance Stats ──────────────────────────────────────────────────────
    total_attendance_logs = await db["attendance_logs"].count_documents({})

    # ── Tutor Profile Stats ───────────────────────────────────────────────────
    total_tutor_profiles = await db["tutor_profiles"].count_documents(
        {"is_approved": True}
    )

    return {
        "users": {
            "total": total_users,
            "students": total_students,
            "tutors": total_tutors,
            "admins": total_admins,
        },
        "tutor_applications": {
            "total": total_applications,
            "pending": pending_applications,
            "approved": approved_applications,
            "rejected": rejected_applications,
        },
        "tutoring_requests": {
            "total": total_requests,
            "pending": pending_requests,
            "accepted": accepted_requests,
            "rejected": rejected_requests,
            "cancelled": cancelled_requests,
        },
        "sessions": {
            "total": total_sessions,
            "scheduled": scheduled_sessions,
            "in_progress": in_progress_sessions,
            "completed": completed_sessions,
            "cancelled": cancelled_sessions,
        },
        "feedback": {
            "total": total_feedback,
            "system_average_rating": system_average_rating,
        },
        "attendance": {
            "total_logs": total_attendance_logs,
        },
        "tutor_profiles": {
            "total_approved": total_tutor_profiles,
        },
    }


async def get_recent_sessions(
    db: AsyncIOMotorDatabase,
    limit: int = 10,
) -> list:
    """
    Fetch the most recently created sessions.
    Used for the recent activity section of the admin dashboard.
    """
    cursor = db["sessions"].find({}).sort("created_at", -1).limit(limit)
    sessions = await cursor.to_list(length=limit)
    return [serialize_doc(s) for s in sessions]


async def get_recent_requests(
    db: AsyncIOMotorDatabase,
    limit: int = 10,
) -> list:
    """
    Fetch the most recently created tutoring requests.
    Used for the recent activity section of the admin dashboard.
    """
    cursor = db["tutoring_requests"].find({}).sort(
        "created_at", -1
    ).limit(limit)
    requests = await cursor.to_list(length=limit)
    return [serialize_doc(r) for r in requests]


async def get_recent_feedback(
    db: AsyncIOMotorDatabase,
    limit: int = 10,
) -> list:
    """
    Fetch the most recently submitted feedback.
    Used for the recent activity section of the admin dashboard.
    """
    cursor = db["feedback"].find({}).sort("created_at", -1).limit(limit)
    feedback_list = await cursor.to_list(length=limit)
    return [serialize_doc(f) for f in feedback_list]


async def get_top_tutors(
    db: AsyncIOMotorDatabase,
    limit: int = 5,
) -> list:
    """
    Fetch the top-rated approved tutors.
    Joins tutor profile with user info for display.
    """
    cursor = db["tutor_profiles"].find(
        {"is_approved": True, "total_reviews": {"$gt": 0}}
    ).sort("average_rating", -1).limit(limit)

    profiles = await cursor.to_list(length=limit)
    result = []

    for profile in profiles:
        serialized = serialize_doc(profile)

        # Enrich with user info
        from bson import ObjectId
        if ObjectId.is_valid(serialized["user_id"]):
            user = await db["users"].find_one(
                {"_id": ObjectId(serialized["user_id"])}
            )
            if user:
                serialized["full_name"] = user.get("full_name", "")
                serialized["email"] = user.get("email", "")
                serialized["school_or_department"] = user.get(
                    "school_or_department", ""
                )

        result.append(serialized)

    return result


async def get_subject_demand(
    db: AsyncIOMotorDatabase,
) -> list:
    """
    Aggregate tutoring requests by subject to show
    which subjects are most in demand.
    """
    pipeline = [
        {"$group": {
            "_id": "$subject",
            "total_requests": {"$sum": 1},
            "accepted": {
                "$sum": {
                    "$cond": [
                        {"$eq": ["$status", "accepted"]}, 1, 0
                    ]
                }
            },
            "pending": {
                "$sum": {
                    "$cond": [
                        {"$eq": ["$status", "pending"]}, 1, 0
                    ]
                }
            },
        }},
        {"$sort": {"total_requests": -1}},
        {"$limit": 10},
    ]

    cursor = db["tutoring_requests"].aggregate(pipeline)
    results = await cursor.to_list(length=10)

    return [
        {
            "subject": r["_id"],
            "total_requests": r["total_requests"],
            "accepted": r["accepted"],
            "pending": r["pending"],
        }
        for r in results
    ]