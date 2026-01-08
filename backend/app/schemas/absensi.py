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
    tanggal: date
    waktu: str
    mata_pelajaran: Optional[str] = None
    guru: Optional[str] = None
    status: str
    method: Optional[str] = "manual"
    confidence: Optional[float] = None
    keterangan: Optional[str] = None
    
    class Config:
        from_attributes = True


class AttendanceHistoryResponse(BaseModel):
    """Paginated attendance history response."""
    data: list[AttendanceRecord]
    total: int
    page: int
    page_size: int
    total_pages: int
