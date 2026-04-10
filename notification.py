from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationCreateSchema(BaseModel):
    """Schema for creating a notification (used internally by services)."""
    user_id: str
    title: str = Field(..., min_length=2, max_length=100)
    message: str = Field(..., min_length=2, max_length=500)


class NotificationResponseSchema(BaseModel):
    """Schema for returning notification data."""
    id: str
    user_id: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationMarkReadSchema(BaseModel):
    """Schema for marking a notification as read."""
    is_read: bool = True