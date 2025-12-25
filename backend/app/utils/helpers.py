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


def get_current_time_status() -> str:
    """
    Determine attendance status based on current time.
    Returns 'hadir' if before 08:00, 'terlambat' if after.
    """
    now = datetime.now()
    cutoff_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
    
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
