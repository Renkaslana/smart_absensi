"""
Admin API Routes
Endpoints for admin dashboard, user management, and reports.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import Optional, List
import io
import csv

from app.api.deps import get_current_admin, get_db
from app.models.user import User
from app.models.absensi import Absensi
from app.models.face_encoding import FaceEncoding
from app.schemas.user import UserResponse, UserCreate, UserUpdate, UserWithStats
from app.schemas.absensi import AbsensiResponse, AbsensiSubmitRequest
from app.schemas.common import ResponseBase, PaginatedResponse
from app.services.attendance_service import attendance_service
from app.services.face_recognition_service import face_service
from app.utils.image_processing import decode_base64_image
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


@router.get("/attendance", response_model=PaginatedResponse[AbsensiResponse])
async def get_all_attendance(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    kelas: Optional[str] = None,
    user_id: Optional[int] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all attendance records with optional filters.
    Returns individual attendance records with student info.
    Requires admin role.
    """
    # Build query with join to User table
    query = db.query(Absensi).join(User, Absensi.user_id == User.id)
    
    # Apply filters
    if start_date:
        query = query.filter(Absensi.date >= start_date)
    if end_date:
        query = query.filter(Absensi.date <= end_date)
    if kelas:
        query = query.filter(User.kelas == kelas)
    if user_id:
        query = query.filter(Absensi.user_id == user_id)
    
    # Order by date and time descending (most recent first)
    query = query.order_by(Absensi.date.desc(), Absensi.timestamp.desc())
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    attendance_list = query.offset(skip).limit(limit).all()
    
    # Build response with user information
    items = []
    for att in attendance_list:
        user = db.query(User).filter(User.id == att.user_id).first()
        if user:
            items.append(AbsensiResponse(
                id=att.id,
                user_id=att.user_id,
                nim=user.nim,
                name=user.name,
                date=att.date,
                time_in=att.timestamp.strftime('%H:%M:%S') if att.timestamp else None,
                timestamp=att.timestamp,
                status=att.status or "hadir",
                confidence=att.confidence,
                image_path=att.image_path,
                user={
                    "nim": user.nim,
                    "name": user.name,
                    "kelas": user.kelas
                },
                already_submitted=False,
                message=f"Absensi pada {att.timestamp.strftime('%H:%M:%S')}" if att.timestamp else ""
            ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1 if limit > 0 else 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit if limit > 0 else 1
    )


@router.get("/students", response_model=PaginatedResponse[UserWithStats])
async def get_all_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    search: Optional[str] = None,
    kelas: Optional[str] = None,
    has_face: Optional[bool] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all students with face registration status and statistics.
    Supports filtering by class, face registration status, and search by name/NIM.
    """
    # Build query
    query = db.query(User).filter(User.role == "user")
    
    # Search by name or NIM
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.name.ilike(search_pattern)) | (User.nim.ilike(search_pattern))
        )
    
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


@router.get("/teachers", response_model=PaginatedResponse[UserWithStats])
async def get_all_teachers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all teachers with face registration status and statistics.
    Similar to students but filters for teacher role.
    """
    # Build query for teachers
    query = db.query(User).filter(User.role == "teacher")
    
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


@router.get("/students/{user_id}", response_model=UserWithStats)
async def get_student_detail(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific student.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Get user statistics
    stats = attendance_service.get_user_statistics(db, user.id)
    
    # Get face encodings count
    encodings_count = db.query(FaceEncoding).filter(
        FaceEncoding.user_id == user.id
    ).count()
    
    return UserWithStats(
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
    )


@router.get("/students/{user_id}/attendance", response_model=PaginatedResponse[AbsensiResponse])
async def get_student_attendance(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get attendance history for a specific student.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    # Build query
    query = db.query(Absensi).filter(Absensi.user_id == user_id)
    
    if start_date:
        query = query.filter(Absensi.date >= start_date)
    if end_date:
        query = query.filter(Absensi.date <= end_date)
    
    # Order by date descending (most recent first)
    query = query.order_by(Absensi.date.desc(), Absensi.timestamp.desc())
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    attendance_list = query.offset(skip).limit(limit).all()
    
    # Build response
    items = [
        AbsensiResponse(
            id=att.id,
            user_id=att.user_id,
            nim=user.nim,
            name=user.name,
            date=att.date,
            timestamp=att.timestamp,
            status=att.status,
            confidence=att.confidence,
            already_submitted=False,
            message=f"Absensi pada {att.timestamp.strftime('%H:%M:%S')}"
        )
        for att in attendance_list
    ]
    
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


@router.post("/teachers", response_model=UserResponse)
async def create_teacher(
    user_data: UserCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new teacher.
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
    
    # Create teacher
    teacher = User(
        nim=user_data.nim,
        name=user_data.name,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role="teacher",
        kelas=user_data.kelas,
        is_active=True,
        has_face=False
    )
    
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    
    return UserResponse.model_validate(teacher)


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
    try:
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
        
        # Calculate overview statistics
        total_students = db.query(User).filter(User.role == "user").count()
        total_absensi = len(report_data)
        
        # Count by status
        by_status = {}
        for record in report_data:
            status_val = record.get("status", "unknown")
            by_status[status_val] = by_status.get(status_val, 0) + 1
        
        # Today's count
        today = date.today()
        today_count = sum(1 for r in report_data if r.get("date") == today.isoformat())
        
        # Calculate attendance rate for today
        attendance_rate_today = round((today_count / total_students * 100) if total_students > 0 else 0, 1)
        
        # Count registered faces
        try:
            registered_faces = db.query(func.count(func.distinct(FaceEncoding.user_id))).scalar() or 0
        except Exception as e:
            print(f"Error counting registered faces: {e}")
            registered_faces = 0
        
        # Unique users who attended
        unique_users = len(set(r.get("nim") for r in report_data if r.get("nim")))
        
        # Student breakdown
        student_attendance = {}
        for record in report_data:
            nim = record.get("nim")
            if not nim:
                continue
                
            if nim not in student_attendance:
                student_attendance[nim] = {
                    "name": record.get("name", "Unknown"),
                    "nim": nim,
                    "total_attendance": 0
                }
            student_attendance[nim]["total_attendance"] += 1
        
        # Calculate attendance rate per student
        total_days = (end_date - start_date).days + 1
        student_breakdown = [
            {
                **data,
                "attendance_rate": round((data["total_attendance"] / total_days * 100) if total_days > 0 else 0, 1)
            }
            for data in student_attendance.values()
        ]
        
        # Sort by total attendance
        student_breakdown.sort(key=lambda x: x["total_attendance"], reverse=True)
        
        # Return JSON with enhanced structure
        return {
            "period": {
                "from": start_date.isoformat(),
                "to": end_date.isoformat()
            },
            "overview": {
                "total_students": total_students,
                "total_absensi": total_absensi,
                "today_count": today_count,
                "attendance_rate_today": attendance_rate_today,
                "registered_faces": registered_faces,
                "unique_users": unique_users,
                "by_status": by_status,
                "daily_summary": [],
                "weekly_summary": [],
                "by_kelas": []
            },
            "student_breakdown": student_breakdown
        }
        
    except Exception as e:
        import traceback
        print(f"❌ Error generating report: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )


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


@router.post("/students/import-csv", response_model=ResponseBase)
async def import_students_from_csv(
    file: UploadFile = File(...),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Import students from CSV file.
    CSV format: nim,nama (headers required)
    Password will be set to same as NIM.
    If NIM already exists, it will be skipped.
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    try:
        # Read CSV content
        content = await file.read()
        decoded = content.decode('utf-8')
        
        # Parse CSV
        reader = csv.DictReader(io.StringIO(decoded))
        
        created_count = 0
        skipped_count = 0
        skipped_nims = []
        
        for row in reader:
            # Get NIM and name from row (support different column names)
            nim = row.get('nim') or row.get('NIM') or row.get('Nim') or ''
            nama = row.get('nama') or row.get('name') or row.get('Nama') or row.get('NAME') or ''
            kelas = row.get('kelas') or row.get('Kelas') or row.get('class') or None
            
            nim = str(nim).strip()
            nama = str(nama).strip()
            
            if not nim or not nama:
                continue
            
            # Check if NIM already exists
            existing = db.query(User).filter(User.nim == nim).first()
            if existing:
                skipped_count += 1
                skipped_nims.append(nim)
                continue
            
            # Create user with password = NIM
            try:
                # Generate email from NIM (optional)
                email = f"{nim}@mhs.harkatnegeri.ac.id"
                
                user = User(
                    nim=nim,
                    name=nama,
                    email=email,
                    password_hash=get_password_hash(nim),  # Password = NIM
                    role="user",
                    kelas=kelas,
                    is_active=True,
                    has_face=False
                )
                
                db.add(user)
                created_count += 1
            except Exception as e:
                print(f"⚠️ Error creating user {nim}: {e}")
                skipped_count += 1
                skipped_nims.append(nim)
        
        db.commit()
        
        print(f"✅ CSV Import: Created {created_count}, Skipped {skipped_count}")
        
        return ResponseBase(
            success=True,
            message=f"Berhasil import {created_count} mahasiswa, {skipped_count} dilewati (NIM sudah ada)",
            data={
                "created": created_count, 
                "skipped": skipped_count,
                "skipped_nims": skipped_nims[:10]  # Show first 10 only
            }
        )
        
    except Exception as e:
        print(f"❌ CSV Import error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error parsing CSV: {str(e)}"
        )

@router.post("/submit-attendance", response_model=AbsensiResponse)
async def admin_submit_attendance(
    request: AbsensiSubmitRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Submit attendance for a student via admin panel.
    Admin scans student face and submits attendance on their behalf.
    """
    try:
        # Decode image
        image = decode_base64_image(request.image_base64)
        
        # Get face encoding from submitted image
        face_encoding = face_service.encode_face(image)
        
        if face_encoding is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No face detected in image. Please try again."
            )
        
        # Find matching user by comparing with all registered faces
        from app.models.face_encoding import FaceEncoding
        
        face_encodings_db = db.query(FaceEncoding).all()
        
        if not face_encodings_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No registered faces in database"
            )
        
        # Group encodings by user
        user_encodings = {}
        for fe in face_encodings_db:
            if fe.user_id not in user_encodings:
                user_encodings[fe.user_id] = []
            try:
                enc = face_service.deserialize_encoding(fe.encoding_data)
                user_encodings[fe.user_id].append(enc)
            except Exception as e:
                print(f"Failed to deserialize encoding for user {fe.user_id}: {e}")
                continue
        
        # Find best match
        best_match_id = None
        best_confidence = 0.0
        
        for user_id, encodings in user_encodings.items():
            is_match, confidence = face_service.compare_faces(encodings, face_encoding)
            if is_match and confidence > best_confidence:
                best_confidence = confidence
                best_match_id = user_id
        
        if best_match_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Face not recognized. Student not registered."
            )
        
        # Get user info
        user = db.query(User).filter(User.id == best_match_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Save attendance image
        from datetime import datetime
        image_path = face_service.save_face_image(
            image,
            user.nim,
            index=int(datetime.now().timestamp())
        )
        
        # Submit attendance for the recognized user
        result = attendance_service.submit_attendance(
            db=db,
            user_id=user.id,
            confidence=best_confidence,
            image_path=image_path
        )
        
        # Handle tuple return (attendance, is_duplicate)
        if isinstance(result, tuple):
            attendance, is_duplicate = result
        else:
            attendance = result
            is_duplicate = False
        
        # Format timestamp
        waktu_absen = attendance.timestamp.strftime("%H:%M:%S")
        
        # Buat pesan informatif
        if is_duplicate:
            message = f"{user.name} ({user.nim}) sudah absen hari ini pada pukul {waktu_absen}"
        else:
            message = f"Absensi berhasil dicatat pada pukul {waktu_absen}"
        
        return AbsensiResponse(
            id=attendance.id,
            user_id=attendance.user_id,
            nim=user.nim,
            name=user.name,
            date=attendance.date,
            timestamp=attendance.timestamp,
            status=attendance.status,
            confidence=attendance.confidence,
            already_submitted=is_duplicate,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Admin submit attendance error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting attendance: {str(e)}"
        )