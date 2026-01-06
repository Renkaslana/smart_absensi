"""
Attendance Service
Handles attendance submission, history, and statistics.
"""

from datetime import datetime, date, time, timedelta
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from app.models.absensi import Absensi
from app.models.user import User
from app.core.config import settings
from app.core.exceptions import BadRequestException, DuplicateException
from app.utils.helpers import get_current_time_status


class AttendanceService:
    """Service for managing attendance records."""
    
    def submit_attendance(
        self,
        db: Session,
        user_id: int,
        confidence: float,
        image_path: str
    ) -> Absensi:
        """
        Submit attendance record.
        
        Args:
            db: Database session
            user_id: User ID
            confidence: Face recognition confidence
            image_path: Path to attendance image
            
        Returns:
            Created attendance record
        """
        today = date.today()
        
        # Check if already submitted today
        existing = db.query(Absensi).filter(
            and_(
                Absensi.user_id == user_id,
                Absensi.date == today
            )
        ).first()
        
        if existing:
            # Return existing attendance with duplicate flag
            # Will be handled by API layer to return appropriate response
            return existing, True  # (attendance, is_duplicate)
        
        # Determine status based on time
        status = get_current_time_status()
        
        # Create attendance record
        attendance = Absensi(
            user_id=user_id,
            date=today,
            timestamp=datetime.now(),
            status=status,
            confidence=confidence,
            image_path=image_path
        )
        
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        return attendance, False  # (attendance, is_duplicate)
    
    def get_user_attendance_history(
        self,
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> List[Absensi]:
        """
        Get user's attendance history.
        
        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
            start_date: Start date filter (optional)
            end_date: End date filter (optional)
            
        Returns:
            List of attendance records
        """
        query = db.query(Absensi).filter(Absensi.user_id == user_id)
        
        if start_date:
            query = query.filter(Absensi.date >= start_date)
        
        if end_date:
            query = query.filter(Absensi.date <= end_date)
        
        return query.order_by(desc(Absensi.date)).offset(skip).limit(limit).all()
    
    def get_today_attendance(self, db: Session, user_id: int) -> Optional[Absensi]:
        """
        Get user's attendance for today.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Today's attendance record or None
        """
        today = date.today()
        
        return db.query(Absensi).filter(
            and_(
                Absensi.user_id == user_id,
                Absensi.date == today
            )
        ).first()
    
    def get_user_statistics(
        self,
        db: Session,
        user_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict:
        """
        Get user's attendance statistics.
        
        Args:
            db: Database session
            user_id: User ID
            start_date: Start date for calculation (optional)
            end_date: End date for calculation (optional)
            
        Returns:
            Dictionary with statistics
        """
        query = db.query(Absensi).filter(Absensi.user_id == user_id)
        
        if start_date:
            query = query.filter(Absensi.date >= start_date)
        
        if end_date:
            query = query.filter(Absensi.date <= end_date)
        
        # Count by status
        total = query.count()
        hadir = query.filter(Absensi.status == "hadir").count()
        terlambat = query.filter(Absensi.status == "terlambat").count()
        tidak_hadir = query.filter(Absensi.status == "tidak_hadir").count()
        
        # Calculate attendance rate based on (hadir + terlambat) / total
        total_days = self._get_total_days(start_date, end_date)
        attendance_rate = ((hadir + terlambat) / total_days * 100) if total_days > 0 else 0.0
        
        # Get streak
        current_streak = self._calculate_streak(db, user_id)
        
        return {
            "total_attendance": total,
            "total_hadir": hadir,
            "total_terlambat": terlambat,
            "total_tidak_hadir": tidak_hadir,
            "attendance_rate": round(attendance_rate, 2),
            "current_streak": current_streak
        }
    
    def get_all_today_attendance(
        self,
        db: Session,
        kelas: Optional[str] = None
    ) -> List[Dict]:
        """
        Get all attendance records for today.
        
        Args:
            db: Database session
            kelas: Filter by class (optional)
            
        Returns:
            List of attendance records with user info
        """
        today = date.today()
        
        query = db.query(Absensi, User).join(User).filter(Absensi.date == today)
        
        if kelas:
            query = query.filter(User.kelas == kelas)
        
        results = query.order_by(Absensi.timestamp).all()
        
        return [
            {
                "id": absensi.id,
                "user_id": user.id,
                "nim": user.nim,
                "name": user.name,
                "kelas": user.kelas,
                "timestamp": absensi.timestamp,
                "status": absensi.status,
                "confidence": absensi.confidence
            }
            for absensi, user in results
        ]
    
    def get_date_statistics(
        self,
        db: Session,
        target_date: date,
        kelas: Optional[str] = None
    ) -> Dict:
        """
        Get attendance statistics for a specific date.
        
        Args:
            db: Database session
            target_date: Target date
            kelas: Filter by class (optional)
            
        Returns:
            Statistics dictionary
        """
        # Get total students
        user_query = db.query(User).filter(User.role == "user")
        if kelas:
            user_query = user_query.filter(User.kelas == kelas)
        total_students = user_query.count()
        
        # Get attendance count
        attendance_query = db.query(Absensi).join(User).filter(Absensi.date == target_date)
        if kelas:
            attendance_query = attendance_query.filter(User.kelas == kelas)
        
        total_present = attendance_query.count()
        total_hadir = attendance_query.filter(Absensi.status == "hadir").count()
        total_terlambat = attendance_query.filter(Absensi.status == "terlambat").count()
        total_absent = total_students - total_present
        
        attendance_percentage = (total_present / total_students * 100) if total_students > 0 else 0.0
        
        return {
            "date": target_date.isoformat(),
            "total_students": total_students,
            "total_present": total_present,
            "total_hadir": total_hadir,
            "total_terlambat": total_terlambat,
            "total_absent": total_absent,
            "attendance_percentage": round(attendance_percentage, 2)
        }
    
    def get_attendance_report(
        self,
        db: Session,
        start_date: date,
        end_date: date,
        kelas: Optional[str] = None
    ) -> List[Dict]:
        """
        Generate attendance report for date range.
        
        Args:
            db: Database session
            start_date: Start date
            end_date: End date
            kelas: Filter by class (optional)
            
        Returns:
            List of attendance records
        """
        query = db.query(Absensi, User).join(User).filter(
            and_(
                Absensi.date >= start_date,
                Absensi.date <= end_date
            )
        )
        
        if kelas:
            query = query.filter(User.kelas == kelas)
        
        results = query.order_by(Absensi.date, User.nim).all()
        
        return [
            {
                "date": absensi.date.isoformat(),
                "nim": user.nim,
                "name": user.name,
                "kelas": user.kelas,
                "timestamp": absensi.timestamp.strftime("%H:%M:%S"),
                "status": absensi.status,
                "confidence": absensi.confidence
            }
            for absensi, user in results
        ]
    
    def _get_total_days(self, start_date: Optional[date], end_date: Optional[date]) -> int:
        """Calculate total days between dates (defaults to current month)."""
        if not start_date:
            start_date = date.today().replace(day=1)
        if not end_date:
            end_date = date.today()
        
        return (end_date - start_date).days + 1
    
    def _calculate_streak(self, db: Session, user_id: int) -> int:
        """Calculate current attendance streak."""
        today = date.today()
        streak = 0
        current_date = today
        
        # Check backwards from today
        for _ in range(30):  # Max 30 days check
            attendance = db.query(Absensi).filter(
                and_(
                    Absensi.user_id == user_id,
                    Absensi.date == current_date
                )
            ).first()
            
            if attendance:
                streak += 1
                current_date -= timedelta(days=1)
            else:
                break
        
        return streak


# Global service instance
attendance_service = AttendanceService()
