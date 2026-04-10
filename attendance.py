from pydantic import BaseModel, Field
from typing import Optional
from app.models.enums import AttendanceStatus


class AttendanceCreateSchema(BaseModel):
    notes: Optional[str] = Field(default=None, max_length=500)


class AttendanceUpdateSchema(BaseModel):
    tutor_attendance: AttendanceStatus
    student_attendance: AttendanceStatus
    notes: Optional[str] = Field(default=None, max_length=500)