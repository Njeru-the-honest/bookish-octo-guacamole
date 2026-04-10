from fastapi import APIRouter
from app.core.config import settings
from app.db.mongodb import get_database

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns application status and basic system info.
    """
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
    }


@router.get("/health/db", tags=["Health"])
async def database_health_check():
    """
    Database connectivity health check.
    Pings MongoDB and returns connection status.
    """
    try:
        db = get_database()
        await db.client.admin.command("ping")
        return {
            "status": "ok",
            "database": settings.DATABASE_NAME,
            "connected": True,
        }
    except Exception as e:
        return {
            "status": "error",
            "database": settings.DATABASE_NAME,
            "connected": False,
            "detail": str(e),
        }