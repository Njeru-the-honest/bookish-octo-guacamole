from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.schemas.base import serialize_doc


async def get_notifications_for_user(
    user_id: str,
    db: AsyncIOMotorDatabase,
    unread_only: bool = False,
) -> list:
    """
    Fetch all notifications for a specific user.
    Optionally filter to only unread notifications.
    Sorted by most recent first.
    """
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False

    cursor = db["notifications"].find(query).sort("created_at", -1)
    notifications = await cursor.to_list(length=50)
    return [serialize_doc(n) for n in notifications]


async def mark_notification_as_read(
    notification_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase,
) -> Optional[dict]:
    """
    Mark a single notification as read.

    Rules:
    - The notification must belong to the requesting user.
    - Returns the updated notification.
    """
    if not ObjectId.is_valid(notification_id):
        raise ValueError("Invalid notification ID.")

    notification = await db["notifications"].find_one(
        {"_id": ObjectId(notification_id)}
    )

    if not notification:
        raise ValueError("Notification not found.")

    if notification["user_id"] != user_id:
        raise ValueError(
            "You are not authorized to update this notification."
        )

    await db["notifications"].update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"is_read": True}}
    )

    updated = await db["notifications"].find_one(
        {"_id": ObjectId(notification_id)}
    )
    return serialize_doc(updated)


async def mark_all_notifications_as_read(
    user_id: str,
    db: AsyncIOMotorDatabase,
) -> dict:
    """
    Mark all notifications for a user as read.
    Returns a count of how many were updated.
    """
    result = await db["notifications"].update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )

    return {
        "updated_count": result.modified_count,
        "message": f"{result.modified_count} notification(s) marked as read.",
    }


async def get_unread_count(
    user_id: str,
    db: AsyncIOMotorDatabase,
) -> int:
    """
    Return the count of unread notifications for a user.
    Used for notification badge in the frontend.
    """
    count = await db["notifications"].count_documents(
        {"user_id": user_id, "is_read": False}
    )
    return count


async def delete_notification(
    notification_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase,
) -> bool:
    """
    Delete a single notification.
    Only the owner of the notification can delete it.
    """
    if not ObjectId.is_valid(notification_id):
        raise ValueError("Invalid notification ID.")

    notification = await db["notifications"].find_one(
        {"_id": ObjectId(notification_id)}
    )

    if not notification:
        raise ValueError("Notification not found.")

    if notification["user_id"] != user_id:
        raise ValueError(
            "You are not authorized to delete this notification."
        )

    await db["notifications"].delete_one(
        {"_id": ObjectId(notification_id)}
    )
    return True