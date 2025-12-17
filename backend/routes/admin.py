# =============================================================================
# ADMIN ROUTES - Enhanced for Academic System
# =============================================================================

from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
import csv
import io
import os
import shutil
from datetime import date
from pathlib import Path

from .auth import get_admin_user, get_current_user
from ..database import (
    get_all_users,
    get_user_by_id,
    get_user_by_nim,
    update_user,
    delete_user,
    create_user,
    create_student,
    get_users_with_embeddings,
    get_absensi_statistics,
    get_all_absensi,
    get_absensi_count,
    get_students_without_face,
    get_students_with_face,
    get_all_kelas,
    get_students_by_kelas,
    get_today_attendance_list,
    log_activity
)
from ..utils.security import hash_password, sanitize_nim, sanitize_name

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

# Directories for face data
ENCODINGS_DIR = Path(__file__).parent.parent.parent / "encodings"
DATASET_DIR = Path(__file__).parent.parent.parent / "dataset_wajah"


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class CreateUserRequest(BaseModel):
    nim: str = Field(..., min_length=5, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    password: Optional[str] = Field(None, min_length=8)
    email: Optional[str] = None
    role: str = Field(default="mahasiswa")
    kelas: Optional[str] = None
    jurusan: Optional[str] = None
    angkatan: Optional[str] = None


class CreateStudentRequest(BaseModel):
    """Create student without password (for face-only attendance)."""
    nim: str = Field(..., min_length=5, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = None
    kelas: Optional[str] = None
    jurusan: Optional[str] = None
    angkatan: Optional[str] = None


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    kelas: Optional[str] = None
    jurusan: Optional[str] = None
    angkatan: Optional[str] = None


class BulkCreateStudentsRequest(BaseModel):
    """Bulk create students from list."""
    students: List[CreateStudentRequest]


# =============================================================================
# ROUTES - DASHBOARD
# =============================================================================

@router.get("/dashboard")
async def get_admin_dashboard(admin_user: dict = Depends(get_admin_user)):
    """
    Get comprehensive admin dashboard data.
    """
    # Get all users
    all_users = get_all_users()
    students = [u for u in all_users if u.get("role") == "mahasiswa"]
    admins = [u for u in all_users if u.get("role") == "admin"]
    
    # Get users with face registered
    users_with_face = get_users_with_embeddings()
    students_without_face = get_students_without_face()
    
    # Get attendance statistics
    attendance_stats = get_absensi_statistics()
    
    # Get today's attendance
    today_attendance = get_today_attendance_list()
    
    # Get all classes
    classes = get_all_kelas()
    
    return {
        "overview": {
            "total_users": len(all_users),
            "total_students": len(students),
            "total_admins": len(admins),
            "users_with_face": len(users_with_face),
            "users_without_face": len(students_without_face),
            "face_registration_rate": round(
                len(users_with_face) / len(students) * 100, 1
            ) if students else 0,
            "total_classes": len(classes)
        },
        "attendance": {
            "today_count": attendance_stats["today_count"],
            "total_students": attendance_stats["total_students"],
            "attendance_rate_today": attendance_stats["attendance_rate_today"],
            "total_absensi": attendance_stats["total_absensi"],
            "daily_summary": attendance_stats["daily_summary"][:7],  # Last 7 days
            "weekly_summary": attendance_stats["weekly_summary"][:4],  # Last 4 weeks
            "by_kelas": attendance_stats["by_kelas"]
        },
        "recent_attendance": today_attendance[:10],
        "classes": classes
    }


@router.get("/statistics")
async def get_detailed_statistics(
    admin_user: dict = Depends(get_admin_user),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """
    Get detailed attendance statistics.
    """
    stats = get_absensi_statistics(date_from=date_from, date_to=date_to)
    
    return {
        "period": {"from": date_from, "to": date_to},
        "statistics": stats
    }


# =============================================================================
# ROUTES - STUDENT MANAGEMENT
# =============================================================================

@router.get("/students")
async def get_all_students(
    admin_user: dict = Depends(get_admin_user),
    include_face_status: bool = True,
    kelas: Optional[str] = None,
    search: Optional[str] = None
):
    """
    Get all registered students with face status.
    """
    if kelas:
        students = get_students_by_kelas(kelas)
    else:
        students = get_all_users(role="mahasiswa")
    
    # Search filter
    if search:
        search_lower = search.lower()
        students = [
            s for s in students 
            if search_lower in s.get("name", "").lower() or 
               search_lower in s.get("nim", "").lower()
        ]
    
    if include_face_status:
        users_with_face = get_users_with_embeddings()
        face_registered_nims = {u["nim"] for u in users_with_face}
        face_data = {u["nim"]: u for u in users_with_face}
        
        for student in students:
            student["face_registered"] = student["nim"] in face_registered_nims
            if student["face_registered"]:
                student["num_encodings"] = face_data[student["nim"]].get("num_encodings", 0)
            student.pop("password", None)
    
    return {
        "total": len(students),
        "students": students
    }


@router.get("/students/without-face")
async def get_students_without_face_registration(
    admin_user: dict = Depends(get_admin_user)
):
    """
    Get students who haven't registered their face yet.
    """
    students = get_students_without_face()
    
    for student in students:
        student.pop("password", None)
    
    return {
        "total": len(students),
        "students": students
    }


@router.get("/students/with-face")
async def get_students_with_face_registration(
    admin_user: dict = Depends(get_admin_user)
):
    """
    Get students who have registered their face.
    """
    students = get_students_with_face()
    
    for student in students:
        student.pop("password", None)
    
    return {
        "total": len(students),
        "students": students
    }


@router.post("/students")
async def create_new_student(
    data: CreateStudentRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Create a new student (without password for face-only attendance).
    """
    nim = sanitize_nim(data.nim)
    name = sanitize_name(data.name)
    
    if not nim or not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid NIM or name format"
        )
    
    existing = get_user_by_nim(nim)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student with this NIM already exists"
        )
    
    student = create_student(
        nim=nim,
        name=name,
        kelas=data.kelas,
        jurusan=data.jurusan,
        angkatan=data.angkatan,
        email=data.email
    )
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create student"
        )
    
    log_activity(
        action="CREATE_STUDENT",
        user_id=admin_user["id"],
        entity_type="user",
        entity_id=student["id"],
        details=f"Created student: {name} ({nim})"
    )
    
    student.pop("password", None)
    logger.info(f"Admin {admin_user['nim']} created student: {nim}")
    
    return {
        "message": "Student created successfully",
        "student": student
    }


@router.post("/students/bulk")
async def create_students_bulk(
    data: BulkCreateStudentsRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Create multiple students at once.
    """
    created = []
    failed = []
    
    for student_data in data.students:
        nim = sanitize_nim(student_data.nim)
        name = sanitize_name(student_data.name)
        
        if not nim or not name:
            failed.append({"nim": student_data.nim, "reason": "Invalid format"})
            continue
        
        existing = get_user_by_nim(nim)
        if existing:
            failed.append({"nim": nim, "reason": "Already exists"})
            continue
        
        student = create_student(
            nim=nim,
            name=name,
            kelas=student_data.kelas,
            jurusan=student_data.jurusan,
            angkatan=student_data.angkatan,
            email=student_data.email
        )
        
        if student:
            student.pop("password", None)
            created.append(student)
        else:
            failed.append({"nim": nim, "reason": "Creation failed"})
    
    log_activity(
        action="BULK_CREATE_STUDENTS",
        user_id=admin_user["id"],
        entity_type="user",
        details=f"Bulk created {len(created)} students, {len(failed)} failed"
    )
    
    return {
        "message": f"Created {len(created)} students, {len(failed)} failed",
        "created": created,
        "failed": failed
    }


@router.get("/students/dropdown")
async def get_students_for_dropdown(
    admin_user: dict = Depends(get_admin_user),
    face_registered: Optional[bool] = None
):
    """
    Get students list for dropdown selection (face registration).
    Returns minimal data for performance.
    """
    if face_registered is None:
        students = get_all_users(role="mahasiswa")
        # Add face status for all students
        users_with_face = get_users_with_embeddings()
        face_registered_nims = {u["nim"] for u in users_with_face}
    elif face_registered:
        students = get_students_with_face()
        face_registered_nims = {s["nim"] for s in students}
    else:
        students = get_students_without_face()
        face_registered_nims = set()
    
    return {
        "students": [
            {
                "id": s["id"],
                "nim": s["nim"],
                "name": s["name"],
                "kelas": s.get("kelas", "-"),
                "jurusan": s.get("jurusan", "-"),
                "has_face": s["nim"] in face_registered_nims
            }
            for s in students
        ]
    }


@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Delete a student account and all related data.
    """
    student = get_user_by_id(student_id)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Verify it's a student (mahasiswa)
    if student.get("role") != "mahasiswa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a student"
        )
    
    # Prevent self-deletion
    if student_id == admin_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    student_nim = student["nim"]
    student_name = student["name"]
    
    # Remove encoding file if exists
    encoding_file = ENCODINGS_DIR / f"{student_name}_{student_nim}.pickle"
    if encoding_file.exists():
        try:
            os.remove(encoding_file)
            logger.info(f"Deleted encoding file: {encoding_file}")
        except Exception as e:
            logger.warning(f"Failed to delete encoding file: {e}")
    
    # Remove dataset images if exists
    student_folder = DATASET_DIR / student_nim
    if student_folder.exists() and student_folder.is_dir():
        try:
            shutil.rmtree(student_folder)
            logger.info(f"Deleted dataset folder: {student_folder}")
        except Exception as e:
            logger.warning(f"Failed to delete dataset folder: {e}")
    
    # Also try to remove old format dataset files
    for i in range(1, 11):
        img_file = DATASET_DIR / f"{student_name}_{student_nim}_{i}.jpg"
        if img_file.exists():
            try:
                os.remove(img_file)
            except Exception:
                pass
    
    # Delete from database (this also deletes face_embeddings and absensi records)
    success = delete_user(student_id)
    
    if success:
        log_activity(
            action="DELETE_STUDENT",
            user_id=admin_user["id"],
            entity_type="user",
            entity_id=student_id,
            details=f"Deleted student: {student_name} ({student_nim})"
        )
        logger.info(f"Admin {admin_user['nim']} deleted student {student_nim}")
        return {"message": "Student deleted successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to delete student"
    )


# =============================================================================
# ROUTES - USER MANAGEMENT
# =============================================================================

@router.get("/users")
async def get_all_users_list(admin_user: dict = Depends(get_admin_user)):
    """
    Get all users (students and admins).
    """
    users = get_all_users()
    
    # Remove passwords
    for user in users:
        user.pop("password", None)
    
    return {
        "total": len(users),
        "users": users
    }


@router.post("/users")
async def create_new_user(
    data: CreateUserRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Create a new user (admin only).
    """
    nim = sanitize_nim(data.nim)
    name = sanitize_name(data.name)
    
    if not nim or not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid NIM or name format"
        )
    
    existing = get_user_by_nim(nim)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this NIM already exists"
        )
    
    if data.role not in ["mahasiswa", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'mahasiswa' or 'admin'"
        )
    
    password_hash = hash_password(data.password) if data.password else None
    user = create_user(
        nim=nim,
        name=name,
        password_hash=password_hash,
        email=data.email,
        role=data.role,
        kelas=data.kelas,
        jurusan=data.jurusan,
        angkatan=data.angkatan
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    log_activity(
        action="CREATE_USER",
        user_id=admin_user["id"],
        entity_type="user",
        entity_id=user["id"],
        details=f"Created user: {name} ({nim}) as {data.role}"
    )
    
    user.pop("password", None)
    logger.info(f"Admin {admin_user['nim']} created user: {nim}")
    
    return {
        "message": "User created successfully",
        "user": user
    }


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: int,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Get user details by ID.
    """
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.pop("password", None)
    
    # Get face embedding status
    from ..database import get_face_embedding, get_user_absensi_statistics
    
    face_status = get_face_embedding(user_id)
    absensi_stats = get_user_absensi_statistics(user_id)
    
    return {
        "user": user,
        "face_registered": face_status is not None,
        "face_encodings": face_status.get("num_encodings", 0) if face_status else 0,
        "attendance_statistics": absensi_stats
    }


@router.put("/users/{user_id}")
async def update_user_info(
    user_id: int,
    data: UpdateUserRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Update user information.
    """
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = {}
    
    if data.name:
        update_data["name"] = sanitize_name(data.name)
    
    if data.email:
        update_data["email"] = data.email
    
    if data.role:
        if data.role not in ["mahasiswa", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
            )
        update_data["role"] = data.role
    
    if data.password:
        update_data["password"] = hash_password(data.password)
    
    if update_data:
        updated_user = update_user(user_id, **update_data)
        updated_user.pop("password", None)
        
        logger.info(f"Admin {admin_user['nim']} updated user {user_id}")
        
        return {
            "message": "User updated successfully",
            "user": updated_user
        }
    
    return {"message": "No changes made"}


@router.delete("/users/{user_id}")
async def delete_user_account(
    user_id: int,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Delete a user account.
    """
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent self-deletion
    if user_id == admin_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = delete_user(user_id)
    
    if success:
        logger.info(f"Admin {admin_user['nim']} deleted user {user['nim']}")
        return {"message": "User deleted successfully"}
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to delete user"
    )


@router.get("/report")
async def get_attendance_report(
    admin_user: dict = Depends(get_admin_user),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """
    Generate attendance report.
    """
    statistics = get_absensi_statistics(
        date_from=date_from,
        date_to=date_to
    )
    
    # Get all students
    students = get_all_users(role="mahasiswa")
    
    # Get attendance records
    records = get_all_absensi(
        date_from=date_from,
        date_to=date_to
    )
    
    # Calculate per-student attendance
    student_stats = {}
    for student in students:
        nim = student["nim"]
        student_records = [r for r in records if r.get("nim") == nim]
        student_stats[nim] = {
            "name": student["name"],
            "nim": nim,
            "total_attendance": len(student_records),
            "attendance_rate": round(
                len(student_records) / statistics["total_absensi"] * 100, 1
            ) if statistics["total_absensi"] > 0 else 0
        }
    
    return {
        "period": {
            "from": date_from,
            "to": date_to
        },
        "overview": statistics,
        "student_breakdown": list(student_stats.values())
    }


@router.post("/make-admin/{user_id}")
async def promote_to_admin(
    user_id: int,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Promote user to admin role.
    """
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user["role"] == "admin":
        return {"message": "User is already an admin"}
    
    updated = update_user(user_id, role="admin")
    
    logger.info(f"Admin {admin_user['nim']} promoted user {user['nim']} to admin")
    
    return {
        "message": f"User {user['name']} promoted to admin",
        "user": {k: v for k, v in updated.items() if k != "password"}
    }


@router.post("/revoke-admin/{user_id}")
async def revoke_admin(
    user_id: int,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Revoke admin role from user.
    """
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_id == admin_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke your own admin role"
        )
    
    if user["role"] != "admin":
        return {"message": "User is not an admin"}
    
    updated = update_user(user_id, role="mahasiswa")
    
    logger.info(f"Admin {admin_user['nim']} revoked admin from user {user['nim']}")
    
    return {
        "message": f"Admin role revoked from {user['name']}",
        "user": {k: v for k, v in updated.items() if k != "password"}
    }
