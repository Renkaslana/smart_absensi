"""
Absensi (attendance) related schemas.
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import date, datetime


class AbsensiSubmitRequest(BaseModel):
    """Schema for submitting attendance."""
    image_base64: str = Field(..., description="Base64 encoded image")
    
    class Config:
        json_schema_extra = {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }


class AbsensiResponse(BaseModel):
    """Schema for attendance response."""
    id: int
    user_id: int
    nim: str
    name: str
    date: date
    timestamp: datetime
    status: str
    confidence: Optional[float] = None
    
    class Config:
        from_attributes = True


class AbsensiHistoryResponse(BaseModel):
    """Attendance history response."""
    items: list[AbsensiResponse]
    total: int
    page: int
    page_size: int


class AbsensiStatsResponse(BaseModel):
    """Attendance statistics response."""
    total_attendance: int
    total_hadir: int
    total_terlambat: int
    attendance_rate: float
    current_streak: int


class TodayAttendanceResponse(BaseModel):
    """Today's attendance check response."""
    has_attended: bool
    attendance: Optional[AbsensiResponse] = None
