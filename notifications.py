from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase


async def create_notification(
    db: AsyncIOMotorDatabase,
    user_id: str,
    title: str,
    message: str,
) -> None:
    """
    Insert a notification document into the notifications collection.
    Used internally by services to notify users of system events.
    """
    notification_doc = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "is_read": False,
        "created_at": datetime.utcnow(),
    }
    await db["notifications"].insert_one(notification_doc)