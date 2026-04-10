from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FeedbackCreateSchema(BaseModel):
    """
    Schema for a student submitting feedback for a completed session.
    """
    session_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)


class FeedbackResponseSchema(BaseModel):
    """
    Schema for returning feedback data.
    """
    id: str
    session_id: str
    student_id: str
    tutor_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True