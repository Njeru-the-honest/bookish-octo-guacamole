from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.enums import SessionStatus


class SessionCreateSchema(BaseModel):
    """
    Schema for creating a session from an accepted tutoring request.
    """
    tutoring_request_id: str
    session_date: str = Field(
        ...,
        description="Session date in YYYY-MM-DD format"
    )
    start_time: str = Field(
        ...,
        description="Session start time in HH:MM format"
    )
    end_time: Optional[str] = Field(
        default=None,
        description="Session end time in HH:MM format"
    )
    duration_minutes: Optional[int] = Field(
        default=None,
        ge=15,
        le=480
    )


class SessionResponseSchema(BaseModel):
    """Schema for returning session data."""
    id: str
    tutoring_request_id: str
    tutor_id: str
    student_id: str
    subject: str
    session_date: str
    start_time: str
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    status: SessionStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionStatusUpdateSchema(BaseModel):
    """Schema for updating a session's status."""
    status: SessionStatus = Field(
        ...,
        description="New session status"
    )