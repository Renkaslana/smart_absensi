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
    time_in: Optional[str] = None  # Time in HH:MM:SS format
    timestamp: datetime
    status: str
    confidence: Optional[float] = None
    image_path: Optional[str] = None
    user: Optional[dict] = None  # User details (nim, name, kelas)
    already_submitted: Optional[bool] = False  # Flag untuk warning duplikasi
    message: Optional[str] = None  # Pesan informatif
    
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
    total_tidak_hadir: int = 0
    attendance_rate: float
    current_streak: int


class TodayAttendanceResponse(BaseModel):
    """Today's attendance check response."""
    has_attended: bool
    attendance: Optional[AbsensiResponse] = None


class AttendanceRecord(BaseModel):
    """Individual attendance record."""
    id: int
    date: date
    timestamp: datetime
    status: str
    confidence: Optional[float] = None
    image_path: Optional[str] = None
    device_info: Optional[str] = None
    ip_address: Optional[str] = None
    
    class Config:
        from_attributes = True
        # Allow timezone-aware datetime to be serialized
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None
        }


class AttendanceHistoryResponse(BaseModel):
    """Paginated attendance history response."""
    data: list[AttendanceRecord]
    total: int
    page: int
    page_size: int
    total_pages: int
