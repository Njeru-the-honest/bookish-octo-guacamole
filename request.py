from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.enums import TutoringRequestStatus


class TutoringRequestCreateSchema(BaseModel):
    """Schema for a student creating a tutoring request."""
    tutor_id: str
    subject: str = Field(..., min_length=2, max_length=100)
    preferred_date: str = Field(
        ...,
        description="Preferred date in YYYY-MM-DD format"
    )
    preferred_time: str = Field(
        ...,
        description="Preferred time in HH:MM format"
    )
    notes: Optional[str] = Field(default=None, max_length=500)


class TutoringRequestResponseSchema(BaseModel):
    """Schema for returning tutoring request data."""
    id: str
    student_id: str
    tutor_id: str
    subject: str
    preferred_date: str
    preferred_time: str
    notes: Optional[str] = None
    status: TutoringRequestStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TutoringRequestUpdateSchema(BaseModel):
    """Schema for tutor accepting or rejecting a tutoring request."""
    status: TutoringRequestStatus = Field(
        ...,
        description="Must be 'accepted' or 'rejected'"
    )