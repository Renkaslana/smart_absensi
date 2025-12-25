"""
Public API Routes
Public endpoints that don't require authentication.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.api.deps import get_db
from app.services.attendance_service import attendance_service

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/today-stats")
async def get_today_statistics(
    kelas: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get today's attendance statistics.
    Public endpoint for display on screens/kiosks.
    """
    today = date.today()
    stats = attendance_service.get_date_statistics(db, today, kelas)
    
    return stats


@router.get("/latest-attendance")
async def get_latest_attendance(
    limit: int = 10,
    kelas: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get latest attendance submissions.
    Public endpoint for display on screens/kiosks.
    """
    attendance_list = attendance_service.get_all_today_attendance(db, kelas)
    
    # Sort by timestamp descending and limit
    attendance_list.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "total": len(attendance_list),
        "latest": attendance_list[:limit]
    }
