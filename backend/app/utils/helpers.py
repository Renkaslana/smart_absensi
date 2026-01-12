"""
Helper utilities.
"""

import os
import hashlib
from datetime import datetime, date
from typing import Optional


def generate_filename(prefix: str, extension: str = "jpg") -> str:
    """
    Generate unique filename with timestamp.
    
    Args:
        prefix: Filename prefix
        extension: File extension
        
    Returns:
        Unique filename
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    random_str = hashlib.md5(str(datetime.now().timestamp()).encode()).hexdigest()[:8]
    return f"{prefix}_{timestamp}_{random_str}.{extension}"


def ensure_directory_exists(directory: str) -> None:
    """
    Create directory if it doesn't exist.
    
    Args:
        directory: Directory path
    """
    os.makedirs(directory, exist_ok=True)


def get_today_date() -> date:
    """Get today's date."""
    return date.today()


def get_attendance_time_config(db):
    """
    Get attendance time configuration from database settings.
    Returns default values if not found.
    """
    from app.models.settings import Settings
    import json
    
    setting = db.query(Settings).filter(Settings.key == "attendance_time_config").first()
    
    if setting:
        try:
            config = json.loads(setting.value)
            return config
        except (json.JSONDecodeError, ValueError):
            pass
    
    # Default configuration
    return {
        "early_time": "07:00",
        "late_threshold": "08:00",
        "early_label": "🌟 Siswa rajin dan baik!",
        "ontime_label": "⚠️ Hampir telat, hati-hati!",
        "late_label": "❌ Terlambat! Tingkatkan disiplin!"
    }


def get_current_time_status(db) -> str:
    """
    Determine attendance status based on current time and database settings.
    Returns 'hadir' if before late_threshold, 'terlambat' if after.
    """
    config = get_attendance_time_config(db)
    
    now = datetime.now()
    late_hour, late_minute = map(int, config["late_threshold"].split(":"))
    cutoff_time = now.replace(hour=late_hour, minute=late_minute, second=0, microsecond=0)
    
    if now <= cutoff_time:
        return "hadir"
    else:
        return "terlambat"


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal attacks.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove directory components
    filename = os.path.basename(filename)
    
    # Replace potentially dangerous characters
    dangerous_chars = ['..', '/', '\\', '\0']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    return filename
