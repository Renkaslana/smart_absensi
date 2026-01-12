"""
Settings Schemas - Request/Response models for settings
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SettingsBase(BaseModel):
    """Base schema for Settings"""
    key: str = Field(..., max_length=100, description="Unique setting key")
    value: str = Field(..., description="Setting value (can be JSON string)")
    description: Optional[str] = Field(None, description="Human-readable description")
    category: Optional[str] = Field(None, max_length=50, description="Setting category")
    is_editable: bool = Field(True, description="Can this setting be edited?")


class SettingsCreate(SettingsBase):
    """Schema for creating a new setting"""
    pass


class SettingsUpdate(BaseModel):
    """Schema for updating an existing setting"""
    value: str = Field(..., description="New value for the setting")
    description: Optional[str] = None


class SettingsResponse(SettingsBase):
    """Schema for Settings response"""
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Specialized schemas for attendance time settings
class AttendanceTimeSettings(BaseModel):
    """Schema for attendance time configuration"""
    early_time: str = Field("07:00", description="Time before this is considered early (HH:MM)")
    late_threshold: str = Field("08:00", description="Time after this is considered late (HH:MM)")
    early_label: str = Field("🌟 Siswa rajin dan baik!", description="Label for early arrivals")
    ontime_label: str = Field("⚠️ Hampir telat, hati-hati!", description="Label for on-time arrivals")
    late_label: str = Field("❌ Terlambat! Tingkatkan disiplin!", description="Label for late arrivals")


class AttendanceTimeSettingsUpdate(BaseModel):
    """Schema for updating attendance time settings"""
    early_time: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    late_threshold: Optional[str] = Field(None, pattern=r"^\d{2}:\d{2}$", description="HH:MM format")
    early_label: Optional[str] = None
    ontime_label: Optional[str] = None
    late_label: Optional[str] = None


# Specialized schemas for liveness detection settings
class LivenessDetectionSettings(BaseModel):
    """Schema for liveness detection configuration"""
    enabled: bool = Field(False, description="Enable liveness detection for public attendance")
    require_blink: bool = Field(True, description="Require eye blink detection")
    require_head_turn: bool = Field(True, description="Require head turn detection")
    min_checks: int = Field(2, ge=1, le=4, description="Minimum checks required (1-4)")
    timeout: int = Field(30, ge=10, le=60, description="Timeout in seconds (10-60)")


class LivenessDetectionSettingsUpdate(BaseModel):
    """Schema for updating liveness detection settings"""
    enabled: Optional[bool] = None
    require_blink: Optional[bool] = None
    require_head_turn: Optional[bool] = None
    min_checks: Optional[int] = Field(None, ge=1, le=4)
    timeout: Optional[int] = Field(None, ge=10, le=60)
