from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.enums import UserRole


class UserRegisterSchema(BaseModel):
    """Schema for user registration request."""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    school_or_department: str = Field(..., min_length=2, max_length=100)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=8)


class UserLoginSchema(BaseModel):
    """Schema for user login request."""
    email: EmailStr
    password: str


class UserResponseSchema(BaseModel):
    """Schema for returning user data in API responses."""
    id: str
    full_name: str
    email: EmailStr
    role: UserRole
    school_or_department: str
    year_of_study: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserUpdateSchema(BaseModel):
    """Schema for updating user profile fields."""
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    school_or_department: Optional[str] = Field(default=None, min_length=2, max_length=100)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=8)


class TokenSchema(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponseSchema