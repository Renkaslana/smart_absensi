"""
Admin API Routes
Endpoints for admin dashboard, user management, and reports.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List
import io
import csv

from app.api.deps import get_current_admin, get_db
from app.models.user import User
from app.models.absensi import Absensi
from app.models.face_encoding import FaceEncoding
from app.schemas.user import UserResponse, UserCreate, UserUpdate, UserWithStats
from app.schemas.absensi import AbsensiResponse
from app.schemas.common import ResponseBase, PaginatedResponse
from app.services.attendance_service import attendance_service
from app.core.security import get_password_hash

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard")
async def get_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get dashboard overview statistics.
    Requires admin role.
    """
    # Total users (students)
    total_students = db.query(User).filter(User.role == "user").count()
    
    # Students with face registered
    students_with_face = db.query(User).filter(
        User.role == "user",
        User.has_face == True
    ).count()
    
    # Today's attendance
    today = date.today()
    today_attendance = attendance_service.get_all_today_attendance(db)
    total_present_today = len(today_attendance)
    
    # Today's statistics
    today_stats = attendance_service.get_date_statistics(db, today)
    
    # This month's statistics
    from datetime import datetime
    first_day = date.today().replace(day=1)
    month_stats = db.query(Absensi).filter(
        Absensi.date >= first_day
    ).count()
    
    return {
        "total_students": total_students,
        "students_with_face": students_with_face,
        "face_registration_percentage": round(
            (students_with_face / total_students * 100) if total_students > 0 else 0, 2
        ),
        "today_present": total_present_today,
        "today_absent": total_students - total_present_today,
        "today_statistics": today_stats,
        "month_total_attendance": month_stats
    }


@router.get("/students", response_model=PaginatedResponse[UserWithStats])
async def get_all_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    kelas: Optional[str] = None,
    has_face: Optional[bool] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all students with face registration status and statistics.
    Supports filtering by class and face registration status.
    """
    # Build query
    query = db.query(User).filter(User.role == "user")
    
    if kelas:
        query = query.filter(User.kelas == kelas)
    
    if has_face is not None:
        query = query.filter(User.has_face == has_face)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    users = query.offset(skip).limit(limit).all()
    
    # Build response with statistics
    items = []
    for user in users:
        # Get user statistics
        stats = attendance_service.get_user_statistics(db, user.id)
        
        # Get face encodings count
        encodings_count = db.query(FaceEncoding).filter(
            FaceEncoding.user_id == user.id
        ).count()
        
        items.append(UserWithStats(
            id=user.id,
            nim=user.nim,
            name=user.name,
            email=user.email,
            role=user.role,
            kelas=user.kelas,
            is_active=user.is_active,
            has_face=user.has_face,
            created_at=user.created_at,
            total_attendance=stats["total_attendance"],
            attendance_rate=stats["attendance_rate"],
            current_streak=stats["current_streak"],
            encodings_count=encodings_count
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit
    )


@router.post("/students", response_model=UserResponse)
async def create_student(
    user_data: UserCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new student.
    Requires admin role.
    """
    # Check if NIM already exists
    existing = db.query(User).filter(User.nim == user_data.nim).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="NIM already registered"
        )
    
    # Check if email already exists
    if user_data.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
    
    # Create user
    user = User(
        nim=user_data.nim,
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role="user",
        kelas=user_data.kelas,
        is_active=True,
        has_face=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.put("/students/{user_id}", response_model=UserResponse)
async def update_student(
    user_id: int,
    user_data: UserUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update student information.
    Requires admin role.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Update fields
    if user_data.name:
        user.name = user_data.name
    if user_data.email:
        # Check email uniqueness
        existing = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already used by another user"
            )
        user.email = user_data.email
    if user_data.kelas:
        user.kelas = user_data.kelas
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    if user_data.password:
        user.password_hash = get_password_hash(user_data.password)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete("/students/{user_id}", response_model=ResponseBase)
async def delete_student(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a student.
    Requires admin role.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete admin user"
        )
    
    # Delete face encodings
    db.query(FaceEncoding).filter(FaceEncoding.user_id == user_id).delete()
    
    # Delete attendance records
    db.query(Absensi).filter(Absensi.user_id == user_id).delete()
    
    # Delete user
    db.delete(user)
    db.commit()
    
    # Delete face images
    from app.services.face_recognition_service import face_service
    face_service.delete_user_images(user.nim)
    
    return ResponseBase(
        success=True,
        message=f"Student {user.name} deleted successfully"
    )


@router.get("/report")
async def get_attendance_report(
    start_date: date = Query(..., description="Start date for report"),
    end_date: date = Query(..., description="End date for report"),
    kelas: Optional[str] = None,
    format: str = Query("json", regex="^(json|csv)$"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Generate attendance report for date range.
    Supports JSON and CSV formats.
    """
    # Get report data
    report_data = attendance_service.get_attendance_report(
        db=db,
        start_date=start_date,
        end_date=end_date,
        kelas=kelas
    )
    
    if format == "csv":
        # Generate CSV
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=["date", "nim", "name", "kelas", "timestamp", "status", "confidence"]
        )
        writer.writeheader()
        writer.writerows(report_data)
        
        # Return CSV response
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=attendance_report_{start_date}_{end_date}.csv"
            }
        )
    
    # Return JSON
    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "kelas": kelas,
        "total_records": len(report_data),
        "data": report_data
    }


@router.get("/statistics/date")
async def get_date_statistics(
    target_date: date = Query(..., description="Target date for statistics"),
    kelas: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get attendance statistics for a specific date.
    """
    stats = attendance_service.get_date_statistics(db, target_date, kelas)
    attendance_list = attendance_service.get_all_today_attendance(db, kelas)
    
    return {
        **stats,
        "attendance_list": attendance_list
    }


@router.post("/students/bulk", response_model=ResponseBase)
async def bulk_create_students(
    students: List[UserCreate],
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Bulk create students.
    Requires admin role.
    """
    created_count = 0
    skipped_count = 0
    errors = []
    
    for student_data in students:
        # Check if NIM exists
        existing = db.query(User).filter(User.nim == student_data.nim).first()
        if existing:
            skipped_count += 1
            errors.append(f"NIM {student_data.nim} already exists")
            continue
        
        try:
            user = User(
                nim=student_data.nim,
                name=student_data.name,
                email=student_data.email,
                password_hash=get_password_hash(student_data.password),
                role="user",
                kelas=student_data.kelas,
                is_active=True,
                has_face=False
            )
            
            db.add(user)
            created_count += 1
        except Exception as e:
            skipped_count += 1
            errors.append(f"Error creating {student_data.nim}: {str(e)}")
    
    db.commit()
    
    return ResponseBase(
        success=True,
        message=f"Created {created_count} students, skipped {skipped_count}",
        data={"created": created_count, "skipped": skipped_count, "errors": errors}
    )
