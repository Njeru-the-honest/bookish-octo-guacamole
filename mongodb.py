from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class MongoDB:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


mongodb = MongoDB()


async def connect_to_mongo():
    """Create database connection on application startup."""
    try:
        mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
        mongodb.db = mongodb.client[settings.DATABASE_NAME]

        # Verify connection is alive
        await mongodb.client.admin.command("ping")
        logger.info(
            f"Connected to MongoDB at {settings.MONGODB_URL} "
            f"| Database: {settings.DATABASE_NAME}"
        )
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e


async def close_mongo_connection():
    """Close database connection on application shutdown."""
    if mongodb.client is not None:
        mongodb.client.close()
        logger.info("MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database instance."""
    if mongodb.db is None:
        raise RuntimeError("Database is not connected. Call connect_to_mongo() first.")
    return mongodb.db