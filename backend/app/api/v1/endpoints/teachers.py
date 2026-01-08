"""
Teacher API Endpoints
Handles all teacher-related operations:
- Dashboard summary
- Class management
- Attendance marking (manual + bulk face scan)
- Report generation & export
- Profile management
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.api import deps
from app.models.user import User
from app.models.absensi import Absensi
from app.models.kelas import Kelas
from app.schemas.user import UserProfile, UpdateUserProfile
from app.schemas.common import ChangePasswordRequest
from app.core.security import get_password_hash, verify_password

router = APIRouter()

# ==================== DASHBOARD ====================

@router.get("/dashboard/summary")
def get_teacher_dashboard_summary(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get teacher dashboard summary statistics
    Returns: total classes, students, today's classes, avg attendance
    """
    # Get all classes taught by this teacher
    # TODO: Add teacher_id to kelas table
    # For now, return dummy stats
    
    total_kelas = db.query(Kelas).count()
    
    # Count total students across all classes
    # TODO: Implement properly with teacher-class relationship
    total_siswa = db.query(User).filter(User.role == "user").count()
    
    # Count today's classes
    # TODO: Implement with schedule table
    kelas_hari_ini = 2
    
    # Calculate average attendance rate
    # Get all attendance records (hadir only)
    total_hadir = db.query(Absensi).filter(Absensi.status == "hadir").count()
    total_records = db.query(Absensi).count()
    
    rata_rata_kehadiran = 0
    if total_records > 0:
        rata_rata_kehadiran = round((total_hadir / total_records) * 100, 1)
    
    return {
        "total_kelas": total_kelas,
        "total_siswa": total_siswa,
        "kelas_hari_ini": kelas_hari_ini,
        "rata_rata_kehadiran": rata_rata_kehadiran
    }


@router.get("/classes/today")
def get_today_classes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get today's classes for teacher
    Returns: list of classes with status (completed/ongoing/upcoming)
    """
    # TODO: Implement with schedule table
    # For now, return empty list
    return []


@router.get("/activity/recent")
def get_recent_activity(
    limit: int = Query(5, ge=1, le=20, description="Number of records to return"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get recent attendance activity
    Returns: recent attendance records with breakdown
    """
    # Get recent attendance records grouped by date and class
    # TODO: Implement properly with joins
    return []


# ==================== CLASS MANAGEMENT ====================

@router.get("/classes")
def get_teacher_classes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get all teacher's classes
    Returns: list of classes with student count, schedule, attendance rate
    """
    # TODO: Add teacher_id to kelas table and filter by teacher
    # For now, return all classes
    
    classes = db.query(Kelas).all()
    
    result = []
    for kelas in classes:
        # Count students in this class
        total_siswa = db.query(User).filter(
            User.role == "user",
            User.kelas == kelas.nama
        ).count()
        
        # Calculate attendance rate for this class
        total_attendance = db.query(Absensi).filter(
            Absensi.kelas_id == kelas.id
        ).count()
        
        total_hadir = db.query(Absensi).filter(
            Absensi.kelas_id == kelas.id,
            Absensi.status == "hadir"
        ).count()
        
        attendance_rate = 0
        if total_attendance > 0:
            attendance_rate = round((total_hadir / total_attendance) * 100, 1)
        
        result.append({
            "id": kelas.id,
            "kelas": kelas.nama,
            "mata_pelajaran": "Matematika",  # TODO: Add to kelas model
            "total_siswa": total_siswa,
            "jadwal": ["Senin 07:00-08:30", "Rabu 09:00-10:30"],  # TODO: From schedule table
            "ruangan": "Lab Komputer 1",  # TODO: From schedule table
            "attendance_rate": attendance_rate
        })
    
    return result


@router.get("/classes/{class_id}")
def get_class_details(
    class_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get specific class details
    """
    kelas = db.query(Kelas).filter(Kelas.id == class_id).first()
    if not kelas:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get students
    students = db.query(User).filter(
        User.role == "user",
        User.kelas == kelas.nama
    ).all()
    
    return {
        "id": kelas.id,
        "kelas": kelas.nama,
        "mata_pelajaran": "Matematika",
        "total_siswa": len(students),
        "students": [{"id": s.id, "name": s.name, "nim": s.nim} for s in students],
        "jadwal": ["Senin 07:00-08:30"],
        "ruangan": "Lab Komputer 1",
    }


@router.get("/classes/{class_id}/students")
def get_students_for_attendance(
    class_id: int,
    date_str: str = Query(..., alias="date", description="Date in YYYY-MM-DD format"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get students for attendance marking
    Returns: list of students with current status (if already marked)
    """
    # Parse date
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get class
    kelas = db.query(Kelas).filter(Kelas.id == class_id).first()
    if not kelas:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get students in this class
    students = db.query(User).filter(
        User.role == "user",
        User.kelas == kelas.nama
    ).all()
    
    result = []
    for student in students:
        # Check if already marked for this date
        attendance = db.query(Absensi).filter(
            Absensi.user_id == student.id,
            Absensi.kelas_id == class_id,
            Absensi.tanggal == target_date
        ).first()
        
        result.append({
            "id": student.id,
            "name": student.name,
            "nis": student.nim,
            "status": attendance.status if attendance else None
        })
    
    return result


# ==================== ATTENDANCE MARKING ====================

@router.post("/attendance/mark")
def mark_attendance(
    kelas_id: int = Body(...),
    tanggal: str = Body(...),
    students: List[dict] = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Mark attendance for multiple students
    Body: { kelas_id, tanggal, students: [{ student_id, status, keterangan? }] }
    """
    # Parse date
    try:
        target_date = datetime.strptime(tanggal, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Validate class exists
    kelas = db.query(Kelas).filter(Kelas.id == kelas_id).first()
    if not kelas:
        raise HTTPException(status_code=404, detail="Class not found")
    
    marked_count = 0
    
    for student_data in students:
        student_id = student_data.get("student_id")
        status = student_data.get("status")
        keterangan = student_data.get("keterangan")
        
        if not student_id or not status:
            continue
        
        # Check if already marked
        existing = db.query(Absensi).filter(
            Absensi.user_id == student_id,
            Absensi.kelas_id == kelas_id,
            Absensi.tanggal == target_date
        ).first()
        
        if existing:
            # Update existing
            existing.status = status
            existing.keterangan = keterangan
            existing.method = "manual"
        else:
            # Create new
            absensi = Absensi(
                user_id=student_id,
                kelas_id=kelas_id,
                tanggal=target_date,
                waktu=datetime.now().time(),
                status=status,
                method="manual",
                keterangan=keterangan
            )
            db.add(absensi)
        
        marked_count += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Attendance marked for {marked_count} students",
        "marked_count": marked_count
    }


@router.post("/attendance/bulk-scan")
async def bulk_face_scan(
    kelas_id: int = Body(...),
    tanggal: str = Body(...),
    images: List[str] = Body(..., description="Array of base64 images"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Bulk face scan for attendance
    Recognizes multiple students from images
    """
    from app.services.face_recognition_service import FaceRecognitionService
    import base64
    
    # Parse date
    try:
        target_date = datetime.strptime(tanggal, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    face_service = FaceRecognitionService(db)
    recognized_students = []
    
    for image_base64 in images:
        try:
            # Remove data URL prefix if exists
            if "," in image_base64:
                image_base64 = image_base64.split(",")[1]
            
            image_data = base64.b64decode(image_base64)
            
            # Recognize face
            result = face_service.recognize_face(image_data)
            
            if result["matched"]:
                student_id = result["user_id"]
                confidence = result["confidence"]
                
                # Check if already marked
                existing = db.query(Absensi).filter(
                    Absensi.user_id == student_id,
                    Absensi.kelas_id == kelas_id,
                    Absensi.tanggal == target_date
                ).first()
                
                if not existing:
                    # Mark attendance
                    absensi = Absensi(
                        user_id=student_id,
                        kelas_id=kelas_id,
                        tanggal=target_date,
                        waktu=datetime.now().time(),
                        status="hadir",
                        method="face_recognition",
                        confidence=confidence
                    )
                    db.add(absensi)
                    
                    student = db.query(User).filter(User.id == student_id).first()
                    recognized_students.append({
                        "student_id": student_id,
                        "name": student.name if student else "Unknown",
                        "confidence": confidence
                    })
        
        except Exception as e:
            # Skip failed images
            continue
    
    db.commit()
    
    return {
        "success": True,
        "recognized_count": len(recognized_students),
        "students": recognized_students
    }


# ==================== REPORTS ====================

@router.get("/reports/generate")
def generate_report(
    kelas_id: Optional[int] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    report_type: str = Query("summary", regex="^(summary|detailed)$"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Generate attendance report
    Returns: summary stats with breakdown
    """
    query = db.query(Absensi)
    
    # Apply filters
    if kelas_id:
        query = query.filter(Absensi.kelas_id == kelas_id)
    
    if date_start:
        start_date = datetime.strptime(date_start, "%Y-%m-%d").date()
        query = query.filter(Absensi.tanggal >= start_date)
    
    if date_end:
        end_date = datetime.strptime(date_end, "%Y-%m-%d").date()
        query = query.filter(Absensi.tanggal <= end_date)
    
    # Get all records
    records = query.all()
    
    # Calculate stats
    total_hadir = sum(1 for r in records if r.status == "hadir")
    total_sakit = sum(1 for r in records if r.status == "sakit")
    total_izin = sum(1 for r in records if r.status == "izin")
    total_alpa = sum(1 for r in records if r.status == "alpa")
    
    # Get unique dates (pertemuan)
    unique_dates = set(r.tanggal for r in records)
    total_pertemuan = len(unique_dates)
    
    # Get unique students
    unique_students = set(r.user_id for r in records)
    total_siswa = len(unique_students)
    
    rata_kehadiran = 0
    if len(records) > 0:
        rata_kehadiran = round((total_hadir / len(records)) * 100, 1)
    
    # Get class name
    kelas_name = "All Classes"
    if kelas_id:
        kelas = db.query(Kelas).filter(Kelas.id == kelas_id).first()
        if kelas:
            kelas_name = kelas.nama
    
    # Format periode
    periode = "All Time"
    if date_start and date_end:
        periode = f"{date_start} - {date_end}"
    elif date_start:
        periode = f"From {date_start}"
    elif date_end:
        periode = f"Until {date_end}"
    
    return {
        "kelas": kelas_name,
        "periode": periode,
        "total_siswa": total_siswa,
        "total_pertemuan": total_pertemuan,
        "rata_kehadiran": rata_kehadiran,
        "hadir": total_hadir,
        "sakit": total_sakit,
        "izin": total_izin,
        "alpa": total_alpa
    }


@router.get("/reports/top-students")
def get_top_students(
    kelas_id: Optional[int] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get top students by attendance rate
    """
    query = db.query(
        User.id,
        User.name,
        User.nim,
        func.count(Absensi.id).label("total"),
        func.sum(func.case((Absensi.status == "hadir", 1), else_=0)).label("hadir")
    ).join(Absensi, User.id == Absensi.user_id)
    
    # Apply filters
    if kelas_id:
        query = query.filter(Absensi.kelas_id == kelas_id)
    
    if date_start:
        start_date = datetime.strptime(date_start, "%Y-%m-%d").date()
        query = query.filter(Absensi.tanggal >= start_date)
    
    if date_end:
        end_date = datetime.strptime(date_end, "%Y-%m-%d").date()
        query = query.filter(Absensi.tanggal <= end_date)
    
    # Group and order
    results = query.group_by(User.id).all()
    
    # Calculate attendance percentage
    students_with_rate = []
    for result in results:
        attendance_rate = 0
        if result.total > 0:
            attendance_rate = round((result.hadir / result.total) * 100, 1)
        
        students_with_rate.append({
            "name": result.name,
            "nis": result.nim,
            "attendance": attendance_rate
        })
    
    # Sort by attendance rate (descending)
    students_with_rate.sort(key=lambda x: x["attendance"], reverse=True)
    
    # Add rank
    for i, student in enumerate(students_with_rate[:limit], 1):
        student["rank"] = i
    
    return students_with_rate[:limit]


@router.get("/reports/low-attendance")
def get_low_attendance_students(
    kelas_id: Optional[int] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    threshold: int = Query(80, ge=0, le=100, description="Attendance % threshold"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get students with low attendance (below threshold)
    """
    query = db.query(
        User.id,
        User.name,
        User.nim,
        func.count(Absensi.id).label("total"),
        func.sum(func.case((Absensi.status == "hadir", 1), else_=0)).label("hadir")
    ).join(Absensi, User.id == Absensi.user_id)
    
    # Apply filters
    if kelas_id:
        query = query.filter(Absensi.kelas_id == kelas_id)
    
    if date_start:
        start_date = datetime.strptime(date_start, "%Y-%m-%d").date()
        query = query.filter(Absensi.tanggal >= start_date)
    
    if date_end:
        end_date = datetime.strptime(date_end, "%Y-%m-%d").date()
        query = query.filter(Absensi.tanggal <= end_date)
    
    # Group
    results = query.group_by(User.id).all()
    
    # Filter by threshold
    low_attendance = []
    for result in results:
        attendance_rate = 0
        if result.total > 0:
            attendance_rate = round((result.hadir / result.total) * 100, 1)
        
        if attendance_rate < threshold:
            low_attendance.append({
                "name": result.name,
                "nis": result.nim,
                "attendance": attendance_rate
            })
    
    # Sort by attendance rate (ascending - lowest first)
    low_attendance.sort(key=lambda x: x["attendance"])
    
    # Add rank
    for i, student in enumerate(low_attendance[:limit], 1):
        student["rank"] = i
    
    return low_attendance[:limit]


@router.get("/reports/export/csv")
def export_report_csv(
    kelas_id: Optional[int] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Export report to CSV
    """
    import csv
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    # Get report data (reuse generate_report logic)
    query = db.query(Absensi).join(User, Absensi.user_id == User.id)
    
    if kelas_id:
        query = query.filter(Absensi.kelas_id == kelas_id)
    if date_start:
        query = query.filter(Absensi.tanggal >= datetime.strptime(date_start, "%Y-%m-%d").date())
    if date_end:
        query = query.filter(Absensi.tanggal <= datetime.strptime(date_end, "%Y-%m-%d").date())
    
    records = query.all()
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Tanggal", "Nama", "NIS", "Kelas", "Status", "Method", "Confidence"])
    
    # Rows
    for record in records:
        writer.writerow([
            record.tanggal.strftime("%Y-%m-%d") if record.tanggal else "",
            record.user.name if record.user else "",
            record.user.nim if record.user else "",
            record.kelas.nama if record.kelas else "",
            record.status,
            record.method or "manual",
            f"{record.confidence:.1f}%" if record.confidence else ""
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.get("/reports/export/pdf")
def export_report_pdf(
    kelas_id: Optional[int] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Export report to PDF
    """
    # TODO: Implement PDF generation with ReportLab
    raise HTTPException(status_code=501, detail="PDF export not yet implemented")


@router.get("/reports/export/excel")
def export_report_excel(
    kelas_id: Optional[int] = Query(None),
    date_start: Optional[str] = Query(None),
    date_end: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Export report to Excel
    """
    # TODO: Implement Excel generation with openpyxl
    raise HTTPException(status_code=501, detail="Excel export not yet implemented")


# ==================== PROFILE ====================

@router.get("/profile", response_model=UserProfile)
def get_teacher_profile(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Get teacher profile
    """
    return current_user


@router.put("/profile", response_model=UserProfile)
def update_teacher_profile(
    profile_data: UpdateUserProfile,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user_teacher)
):
    """
    Update teacher profile
    """
    # Update fields
    if profile_data.name:
        current_user.name = profile_data.name
    if profile_data.email:
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
    current_user: User = Depends(deps.get_current_user_teacher)
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
