"""
Settings API Endpoints - Manage application-wide settings
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.db.session import get_db
from app.models.user import User
from app.models.settings import Settings
from app.schemas.settings import (
    SettingsCreate,
    SettingsUpdate,
    SettingsResponse,
    AttendanceTimeSettings,
    AttendanceTimeSettingsUpdate,
    LivenessDetectionSettings,
    LivenessDetectionSettingsUpdate
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("/", response_model=List[SettingsResponse])
async def get_all_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all settings (admin only for full list, users can see public settings)
    """
    settings = db.query(Settings).all()
    
    # Non-admins can only see editable settings
    if current_user.role != "admin":
        settings = [s for s in settings if s.is_editable]
    
    return settings


@router.get("/by-key/{key}", response_model=SettingsResponse)
async def get_setting_by_key(
    key: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific setting by key (public endpoint)
    """
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting with key '{key}' not found"
        )
    return setting


@router.get("/attendance-times", response_model=AttendanceTimeSettings)
async def get_attendance_time_settings(
    db: Session = Depends(get_db)
):
    """
    Get attendance time configuration (public endpoint)
    Returns default values if not configured
    """
    setting = db.query(Settings).filter(
        Settings.key == "attendance_time_config"
    ).first()
    
    if setting:
        try:
            config = json.loads(setting.value)
            return AttendanceTimeSettings(**config)
        except (json.JSONDecodeError, ValueError):
            pass
    
    # Return defaults if not found or invalid
    return AttendanceTimeSettings()


@router.put("/attendance-times", response_model=AttendanceTimeSettings)
async def update_attendance_time_settings(
    update_data: AttendanceTimeSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Update attendance time configuration (admin only)
    """
    # Get existing setting or create new one
    setting = db.query(Settings).filter(
        Settings.key == "attendance_time_config"
    ).first()
    
    if setting:
        # Update existing
        current_config = json.loads(setting.value)
        
        # Update only provided fields
        if update_data.early_time:
            current_config["early_time"] = update_data.early_time
        if update_data.late_threshold:
            current_config["late_threshold"] = update_data.late_threshold
        if update_data.early_label:
            current_config["early_label"] = update_data.early_label
        if update_data.ontime_label:
            current_config["ontime_label"] = update_data.ontime_label
        if update_data.late_label:
            current_config["late_label"] = update_data.late_label
        
        setting.value = json.dumps(current_config)
    else:
        # Create new setting
        default_config = AttendanceTimeSettings().dict()
        
        # Apply updates
        if update_data.early_time:
            default_config["early_time"] = update_data.early_time
        if update_data.late_threshold:
            default_config["late_threshold"] = update_data.late_threshold
        if update_data.early_label:
            default_config["early_label"] = update_data.early_label
        if update_data.ontime_label:
            default_config["ontime_label"] = update_data.ontime_label
        if update_data.late_label:
            default_config["late_label"] = update_data.late_label
        
        setting = Settings(
            key="attendance_time_config",
            value=json.dumps(default_config),
            description="Attendance time thresholds and labels configuration",
            category="attendance",
            is_editable=True
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    
    return AttendanceTimeSettings(**json.loads(setting.value))


@router.get("/liveness-detection", response_model=LivenessDetectionSettings)
async def get_liveness_detection_settings(
    db: Session = Depends(get_db)
):
    """
    Get liveness detection configuration (public endpoint)
    Returns default values if not configured
    """
    setting = db.query(Settings).filter(
        Settings.key == "liveness_detection_config"
    ).first()
    
    if setting:
        try:
            config = json.loads(setting.value)
            return LivenessDetectionSettings(**config)
        except (json.JSONDecodeError, ValueError):
            pass
    
    # Return defaults if not found or invalid
    return LivenessDetectionSettings()


@router.put("/liveness-detection", response_model=LivenessDetectionSettings)
async def update_liveness_detection_settings(
    update_data: LivenessDetectionSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Update liveness detection configuration (admin only)
    """
    # Get existing setting or create new one
    setting = db.query(Settings).filter(
        Settings.key == "liveness_detection_config"
    ).first()
    
    if setting:
        # Update existing
        current_config = json.loads(setting.value)
        
        # Update only provided fields
        if update_data.enabled is not None:
            current_config["enabled"] = update_data.enabled
        if update_data.require_blink is not None:
            current_config["require_blink"] = update_data.require_blink
        if update_data.require_head_turn is not None:
            current_config["require_head_turn"] = update_data.require_head_turn
        if update_data.min_checks is not None:
            current_config["min_checks"] = update_data.min_checks
        if update_data.timeout is not None:
            current_config["timeout"] = update_data.timeout
        
        setting.value = json.dumps(current_config)
    else:
        # Create new setting
        default_config = LivenessDetectionSettings().dict()
        
        # Apply updates
        if update_data.enabled is not None:
            default_config["enabled"] = update_data.enabled
        if update_data.require_blink is not None:
            default_config["require_blink"] = update_data.require_blink
        if update_data.require_head_turn is not None:
            default_config["require_head_turn"] = update_data.require_head_turn
        if update_data.min_checks is not None:
            default_config["min_checks"] = update_data.min_checks
        if update_data.timeout is not None:
            default_config["timeout"] = update_data.timeout
        
        setting = Settings(
            key="liveness_detection_config",
            value=json.dumps(default_config),
            description="Liveness detection configuration for public attendance",
            category="security",
            is_editable=True
        )
        db.add(setting)
    
    db.commit()
    db.refresh(setting)
    
    return LivenessDetectionSettings(**json.loads(setting.value))


@router.post("/", response_model=SettingsResponse, status_code=status.HTTP_201_CREATED)
async def create_setting(
    setting_data: SettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Create a new setting (admin only)
    """
    # Check if key already exists
    existing = db.query(Settings).filter(Settings.key == setting_data.key).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Setting with key '{setting_data.key}' already exists"
        )
    
    setting = Settings(**setting_data.dict())
    db.add(setting)
    db.commit()
    db.refresh(setting)
    
    return setting


@router.put("/{setting_id}", response_model=SettingsResponse)
async def update_setting(
    setting_id: int,
    update_data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Update an existing setting (admin only)
    """
    setting = db.query(Settings).filter(Settings.id == setting_id).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting with ID {setting_id} not found"
        )
    
    if not setting.is_editable:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This setting is not editable"
        )
    
    # Update fields
    setting.value = update_data.value
    if update_data.description is not None:
        setting.description = update_data.description
    
    db.commit()
    db.refresh(setting)
    
    return setting


@router.delete("/{setting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_setting(
    setting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Delete a setting (admin only)
    """
    setting = db.query(Settings).filter(Settings.id == setting_id).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting with ID {setting_id} not found"
        )
    
    if not setting.is_editable:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This setting cannot be deleted"
        )
    
    setting_key = setting.key
    db.delete(setting)
    db.commit()
