from enum import Enum


class UserRole(str, Enum):
    student = "student"
    tutor = "tutor"
    admin = "admin"


class TutorApplicationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class TutoringRequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"


class SessionStatus(str, Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class AttendanceStatus(str, Enum):
    pending = "pending"
    present = "present"
    absent = "absent"
    excused = "excused"