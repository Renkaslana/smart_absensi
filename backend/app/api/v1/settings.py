"""
Settings API Routes
Endpoints for managing application settings
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.api.deps import get_db, get_current_admin
from app.models.settings import Settings
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/attendance-times")
async def get_attendance_time_settings(db: Session = Depends(get_db)):
    """
    Get attendance time configuration (public endpoint)
    Returns: early_time, late_threshold, and labels
    """
    # Get setting from database
    setting = db.query(Settings).filter(
        Settings.key == "attendance_time_config"
    ).first()
    
    if not setting:
        # Return default values if not configured
        return {
            "early_time": "07:00",
            "late_threshold": "08:00",
            "early_label": "🌟 Siswa rajin dan baik!",
            "ontime_label": "⚠️ Hampir telat, hati-hati!",
            "late_label": "❌ Terlambat! Tingkatkan disiplin!"
        }
    
    # Parse JSON value
    config = json.loads(setting.value)
    return config


@router.put("/attendance-times")
async def update_attendance_time_settings(
    early_time: str = None,
    late_threshold: str = None,
    early_label: str = None,
    ontime_label: str = None,
    late_label: str = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update attendance time configuration (admin only)
    """
    # Get existing setting
    setting = db.query(Settings).filter(
        Settings.key == "attendance_time_config"
    ).first()
    
    if not setting:
        # Create new setting if doesn't exist
        config = {
            "early_time": early_time or "07:00",
            "late_threshold": late_threshold or "08:00",
            "early_label": early_label or "🌟 Siswa rajin dan baik!",
            "ontime_label": ontime_label or "⚠️ Hampir telat, hati-hati!",
            "late_label": late_label or "❌ Terlambat! Tingkatkan disiplin!"
        }
        
        setting = Settings(
            key="attendance_time_config",
            value=json.dumps(config),
            description="Attendance time thresholds and labels",
            category="attendance",
            is_editable=True
        )
        db.add(setting)
    else:
        # Update existing setting
        config = json.loads(setting.value)
        
        if early_time:
            config["early_time"] = early_time
        if late_threshold:
            config["late_threshold"] = late_threshold
        if early_label:
            config["early_label"] = early_label
        if ontime_label:
            config["ontime_label"] = ontime_label
        if late_label:
            config["late_label"] = late_label
        
        setting.value = json.dumps(config)
    
    db.commit()
    db.refresh(setting)
    
    return json.loads(setting.value)
