from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SubjectCreateSchema(BaseModel):
    """Schema for creating a new subject."""
    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = Field(default=None, max_length=300)


class SubjectResponseSchema(BaseModel):
    """Schema for returning subject data."""
    id: str
    name: str
    code: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True