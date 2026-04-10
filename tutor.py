from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.enums import TutorApplicationStatus


class TutorApplicationCreateSchema(BaseModel):
    """Schema for submitting a tutor application."""
    subjects: List[str] = Field(..., min_length=1)
    bio: str = Field(..., min_length=20, max_length=1000)
    availability: str = Field(..., min_length=5, max_length=300)


class TutorApplicationResponseSchema(BaseModel):
    """Schema for returning tutor application data."""
    id: str
    user_id: str
    subjects: List[str]
    bio: str
    availability: str
    status: TutorApplicationStatus
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TutorApplicationReviewSchema(BaseModel):
    """Schema for admin reviewing a tutor application."""
    status: TutorApplicationStatus = Field(
        ...,
        description="Must be 'approved' or 'rejected'"
    )
    review_notes: Optional[str] = Field(default=None, max_length=500)


class TutorProfileResponseSchema(BaseModel):
    """Schema for returning tutor profile data."""
    id: str
    user_id: str
    subjects: List[str]
    bio: str
    availability: str
    average_rating: float
    total_reviews: int
    is_approved: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TutorProfileUpdateSchema(BaseModel):
    """Schema for updating a tutor's own profile."""
    subjects: Optional[List[str]] = None
    bio: Optional[str] = Field(default=None, min_length=20, max_length=1000)
    availability: Optional[str] = Field(default=None, min_length=5, max_length=300)


class TutorPublicProfileSchema(BaseModel):
    """
    Schema for public tutor discovery.
    Combines tutor profile with basic user info.
    """
    id: str
    user_id: str
    full_name: str
    school_or_department: str
    subjects: List[str]
    bio: str
    availability: str
    average_rating: float
    total_reviews: int

    class Config:
        from_attributes = True