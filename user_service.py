from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional

from app.schemas.user import UserUpdateSchema
from app.schemas.base import serialize_doc


async def get_user_profile(
    user_id: str,
    db: AsyncIOMotorDatabase
) -> Optional[dict]:
    """
    Fetch a user's full profile by their ID.
    Returns serialized user dict or None.
    """
    if not ObjectId.is_valid(user_id):
        return None

    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        return None

    return serialize_doc(user)


async def update_user_profile(
    user_id: str,
    data: UserUpdateSchema,
    db: AsyncIOMotorDatabase
) -> Optional[dict]:
    """
    Update allowed user profile fields.
    Only updates fields that are explicitly provided (not None).
    Returns the updated user document.
    """
    if not ObjectId.is_valid(user_id):
        return None

    # Build update dict from only provided fields
    update_fields = {
        k: v for k, v in data.model_dump().items()
        if v is not None
    }

    if not update_fields:
        # Nothing to update — return current profile
        return await get_user_profile(user_id, db)

    update_fields["updated_at"] = datetime.utcnow()

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )

    return await get_user_profile(user_id, db)


async def get_all_users(
    db: AsyncIOMotorDatabase,
    role: Optional[str] = None
) -> list:
    """
    Fetch all users, optionally filtered by role.
    Used by admin endpoints.
    """
    query = {}
    if role:
        query["role"] = role

    cursor = db["users"].find(query).sort("created_at", -1)
    users = await cursor.to_list(length=100)
    return [serialize_doc(u) for u in users]