"""
Student API Endpoints
Handles all student-related operations:
- Dashboard summary
- Schedule retrieval
- Attendance history
- Face registration
- Profile management
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.api import deps
from app.models.user import User
from app.models.absensi import Absensi
from app.models.face_encoding import FaceEncoding
from app.schemas.user import UserProfile, UpdateUserProfile
from app.schemas.absensi import AttendanceRecord, AttendanceHistoryResponse
from app.schemas.face import FaceRegistrationStatus, FacePhoto
from app.schemas.common import ChangePasswordRequest
from app.core.security import get_password_hash, verify_password
from app.services.face_recognition_service import FaceRecognitionService as FaceService
from app.services.attendance_service import AttendanceService

router = APIRouter()

# ==================== DASHBOARD ====================

@router.get("/dashboard/summary")
def get_student_dashboard_summary(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Get student dashboard summary statistics
    Returns: attendance stats, percentages
    """
    attendance_service = AttendanceService(db)
    
    # Get all attendance records for this student
    total_hadir = db.query(Absensi).filter(
        Absensi.user_id == current_user.id,
        Absensi.status == "hadir"
    ).count()
    
    total_sakit = db.query(Absensi).filter(
        Absensi.user_id == current_user.id,
        Absensi.status == "sakit"
    ).count()
    
    total_izin = db.query(Absensi).filter(
        Absensi.user_id == current_user.id,
        Absensi.status == "izin"
    ).count()
    
    total_alpa = db.query(Absensi).filter(
        Absensi.user_id == current_user.id,
        Absensi.status == "alpa"
    ).count()
    
    total_pertemuan = total_hadir + total_sakit + total_izin + total_alpa
    
    persentase_kehadiran = 0
    if total_pertemuan > 0:
        persentase_kehadiran = round((total_hadir / total_pertemuan) * 100, 1)
    
    return {
        "total_hadir": total_hadir,
        "total_sakit": total_sakit,
        "total_izin": total_izin,
        "total_alpa": total_alpa,
        "total_pertemuan": total_pertemuan,
        "persentase_kehadiran": persentase_kehadiran
    }


# ==================== SCHEDULE ====================

@router.get("/schedule")
def get_student_schedule(
    week: Optional[int] = Query(None, description="Week number (optional)"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Get student weekly schedule
    Returns: list of classes with day, time, subject, teacher, room
    """
    # TODO: Implement schedule table and query
    # For now, return empty list (frontend has dummy data)
    return []


# ==================== ATTENDANCE HISTORY ====================

@router.get("/attendance/history", response_model=AttendanceHistoryResponse)
def get_attendance_history(
    date_start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by subject/teacher"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Get attendance history with filters and pagination
    """
    query = db.query(Absensi).filter(Absensi.user_id == current_user.id)
    
    # Apply filters
    if date_start:
        try:
            start_date = datetime.strptime(date_start, "%Y-%m-%d").date()
            query = query.filter(Absensi.tanggal >= start_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_start format. Use YYYY-MM-DD")
    
    if date_end:
        try:
            end_date = datetime.strptime(date_end, "%Y-%m-%d").date()
            query = query.filter(Absensi.tanggal <= end_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_end format. Use YYYY-MM-DD")
    
    if status and status in ["hadir", "sakit", "izin", "alpa"]:
        query = query.filter(Absensi.status == status)
    
    # TODO: Add search by subject/teacher (requires kelas relationship)
    
    # Count total before pagination
    total = query.count()
    
    # Apply pagination
    skip = (page - 1) * page_size
    records = query.order_by(Absensi.tanggal.desc(), Absensi.waktu.desc()).offset(skip).limit(page_size).all()
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size  # Ceiling division
    
    return {
        "data": records,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/attendance/export")
def export_attendance_history(
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Export attendance history to CSV
    """
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    query = db.query(Absensi).filter(Absensi.user_id == current_user.id)
    
    # Apply same filters as history endpoint
    if date_start:
        start_date = datetime.strptime(date_start, "%Y-%m-%d").date()
        query = query.filter(Absensi.tanggal >= start_date)
    
    if date_end:
        end_date = datetime.strptime(date_end, "%Y-%m-%d").date()
        query = query.filter(Absensi.tanggal <= end_date)
    
    if status:
        query = query.filter(Absensi.status == status)
    
    records = query.order_by(Absensi.tanggal.desc()).all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Tanggal", "Waktu", "Mata Pelajaran", "Guru", "Status", "Method", "Confidence", "Keterangan"])
    
    # Rows
    for record in records:
        writer.writerow([
            record.tanggal.strftime("%Y-%m-%d") if record.tanggal else "",
            record.waktu.strftime("%H:%M:%S") if record.waktu else "",
            record.kelas.nama if record.kelas else "",  # TODO: Add mata_pelajaran field
            "",  # TODO: Add guru from kelas relationship
            record.status,
            record.method or "manual",
            f"{record.confidence:.1f}%" if record.confidence else "",
            record.keterangan or ""
        ])
    
    # Return as downloadable CSV
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


# ==================== FACE REGISTRATION ====================

@router.get("/face/status", response_model=FaceRegistrationStatus)
def get_face_registration_status(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Get face registration status
    Returns: status (complete/partial/not_registered), photo count, photos
    """
    face_service = FaceService()
    
    # Get all face encodings for this user
    encodings = db.query(FaceEncoding).filter(FaceEncoding.user_id == current_user.id).all()
    
    total_photos = len(encodings)
    required_photos = 3  # Minimum required
    
    # Determine status
    if total_photos == 0:
        status = "not_registered"
    elif total_photos < required_photos:
        status = "partial"
    else:
        status = "complete"
    
    # Format photos
    photos = []
    for enc in encodings:
        photos.append({
            "id": enc.id,
            "image_url": enc.image_path,
            "quality_score": enc.confidence or 0,
            "uploaded_at": enc.created_at.isoformat()
        })
    
    return {
        "status": status,
        "total_photos": total_photos,
        "required_photos": required_photos,
        "photos": photos
    }


@router.post("/face/register", response_model=FacePhoto)
async def register_face_photo(
    image: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Register a face photo
    Validates quality and stores encoding
    """
    face_service = FaceService()
    
    # Check if already has max photos (5)
    existing_count = db.query(FaceEncoding).filter(FaceEncoding.user_id == current_user.id).count()
    if existing_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 photos allowed")
    
    # Read image data
    image_data = await image.read()
    
    # Process and save face
    try:
        result = face_service.register_face(
            user_id=current_user.id,
            image_data=image_data,
            filename=image.filename
        )
        
        return {
            "id": result["encoding_id"],
            "image_url": result["image_path"],
            "quality_score": result["quality_score"],
            "uploaded_at": datetime.now().isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")


@router.delete("/face/photos/{photo_id}")
def delete_face_photo(
    photo_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Delete a face photo
    """
    # Find encoding
    encoding = db.query(FaceEncoding).filter(
        FaceEncoding.id == photo_id,
        FaceEncoding.user_id == current_user.id
    ).first()
    
    if not encoding:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    # Delete file if exists
    import os
    if encoding.image_path and os.path.exists(encoding.image_path):
        os.remove(encoding.image_path)
    
    # Delete from database
    db.delete(encoding)
    db.commit()
    
    return {"message": "Photo deleted successfully"}


# ==================== PROFILE ====================

@router.get("/profile", response_model=UserProfile)
def get_student_profile(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Get student profile
    """
    return current_user


@router.put("/profile", response_model=UserProfile)
def update_student_profile(
    profile_data: UpdateUserProfile,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Update student profile
    Allowed fields: name, email, phone, address, birth_date
    """
    # Update fields
    if profile_data.name:
        current_user.name = profile_data.name
    if profile_data.email:
        # Check if email already exists
        existing = db.query(User).filter(User.email == profile_data.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = profile_data.email
    if profile_data.phone:
        current_user.phone = profile_data.phone
    if profile_data.address:
        current_user.address = profile_data.address
    if profile_data.birth_date:
        current_user.birth_date = profile_data.birth_date
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/password/change")
def change_password(
    password_data: ChangePasswordRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Change password
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


# ==================== SELF ATTENDANCE ====================

@router.post("/attendance/mark")
async def mark_attendance(
    kelas_id: int,
    method: str = "manual",
    image: Optional[UploadFile] = File(None),
    keterangan: Optional[str] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_student)
):
    """
    Mark attendance (student self-check-in)
    Can be manual or face_recognition
    """
    attendance_service = AttendanceService(db)
    
    # Check if already marked today for this class
    today = date.today()
    existing = db.query(Absensi).filter(
        Absensi.user_id == current_user.id,
        Absensi.kelas_id == kelas_id,
        Absensi.tanggal == today
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for today")
    
    confidence = None
    
    # If face recognition
    if method == "face_recognition" and image:
        face_service = FaceService()
        image_data = await image.read()
        
        try:
            # Recognize face
            result = face_service.recognize_face(image_data)
            
            if not result["matched"]:
                raise HTTPException(status_code=400, detail="Face not recognized")
            
            if result["user_id"] != current_user.id:
                raise HTTPException(status_code=400, detail="Face does not match your profile")
            
            confidence = result["confidence"]
            
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Face recognition failed: {str(e)}")
    
    # Create attendance record
    absensi = Absensi(
        user_id=current_user.id,
        kelas_id=kelas_id,
        tanggal=today,
        waktu=datetime.now().time(),
        status="hadir",
        method=method,
        confidence=confidence,
        keterangan=keterangan
    )
    
    db.add(absensi)
    db.commit()
    db.refresh(absensi)
    
    return {
        "success": True,
        "message": "Attendance marked successfully",
        "confidence": confidence,
        "attendance_id": absensi.id
    }
