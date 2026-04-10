from datetime import timedelta
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime

from app.schemas.user import UserRegisterSchema, UserLoginSchema, UserResponseSchema, TokenSchema
from app.utils.security import hash_password, verify_password, create_access_token
from app.schemas.base import serialize_doc
from app.core.config import settings


async def register_user(
    data: UserRegisterSchema,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Register a new user.

    Steps:
    1. Check if email already exists
    2. Hash the password
    3. Insert user document into MongoDB
    4. Return the created user
    """
    # Check if email is already taken
    existing = await db["users"].find_one({"email": data.email})
    if existing:
        raise ValueError("A user with this email already exists.")

    now = datetime.utcnow()

    user_doc = {
        "full_name": data.full_name,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "role": "student",  # All new users start as students
        "school_or_department": data.school_or_department,
        "year_of_study": data.year_of_study,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    result = await db["users"].insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    return serialize_doc(user_doc)


async def login_user(
    data: UserLoginSchema,
    db: AsyncIOMotorDatabase
) -> dict:
    """
    Authenticate a user and return a JWT token.

    Steps:
    1. Find user by email
    2. Verify password
    3. Check account is active
    4. Create and return JWT token with user data
    """
    user = await db["users"].find_one({"email": data.email})

    if not user:
        raise ValueError("Invalid email or password.")

    if not verify_password(data.password, user["hashed_password"]):
        raise ValueError("Invalid email or password.")

    if not user.get("is_active", True):
        raise ValueError("This account has been deactivated.")

    serialized_user = serialize_doc(user)

    # Build JWT payload
    token_data = {
        "sub": serialized_user["id"],
        "email": serialized_user["email"],
        "role": serialized_user["role"],
    }

    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialized_user,
    }


async def get_user_by_id(
    user_id: str,
    db: AsyncIOMotorDatabase
) -> Optional[dict]:
    """
    Fetch a user document by their MongoDB ObjectId string.
    Returns serialized user dict or None if not found.
    """
    if not ObjectId.is_valid(user_id):
        return None

    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        return None

    return serialize_doc(user)