# =============================================================================
# PUBLIC ROUTES - NO AUTHENTICATION REQUIRED
# =============================================================================
# Routes for student attendance without login requirement
# Features: Face scan for attendance, history lookup by NIM

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from ..database import get_wib_now
import numpy as np
import cv2
import base64
import logging
from pathlib import Path

from ..database import (
    get_user_by_nim,
    create_absensi,
    check_already_attended_today,
    get_absensi_by_nim,
    get_user_absensi_statistics,
    get_users_with_embeddings,
    log_activity
)
from ..services import FaceRecognizer
from ..utils.security import rate_limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/public", tags=["Public - Student Attendance"])

# Initialize face recognizer
ENCODINGS_DIR = Path(__file__).parent.parent.parent / "encodings"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

face_recognizer = FaceRecognizer(
    encodings_dir=str(ENCODINGS_DIR),
    recognition_tolerance=0.6,
    min_confidence=60.0
)


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class ScanAttendanceRequest(BaseModel):
    """Request model for face scan attendance."""
    image: str  # Base64 encoded image
    device_info: Optional[str] = None
    location: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "image": "base64_encoded_image",
                "device_info": "Chrome/Windows",
                "location": "Ruang Kuliah A101"
            }
        }


class HistoryLookupRequest(BaseModel):
    """Request model for attendance history lookup."""
    nim: str = Field(..., min_length=5, max_length=20)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decode base64 image to numpy array."""
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        image_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Failed to decode image")
        
        return image
    except Exception as e:
        logger.error(f"Error decoding image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image data: {str(e)}"
        )


# =============================================================================
# PUBLIC ROUTES - NO LOGIN REQUIRED
# =============================================================================

@router.post("/scan-attendance")
async def scan_attendance(
    request: Request,
    data: ScanAttendanceRequest
):
    """
    Submit attendance via face recognition WITHOUT LOGIN.
    
    This is the main endpoint for students to scan their face and record attendance.
    Implements duplicate attendance prevention - only one attendance per day.
    
    Flow:
    1. Decode image from base64
    2. Run face recognition
    3. If recognized, check if already attended today
    4. If not attended, create attendance record
    5. Return result with student info and confidence
    """
    # Rate limiting per IP
    client_ip = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(client_ip, limit=30, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Terlalu banyak percobaan. Mohon tunggu sebentar."
        )
    
    # Decode image
    image = decode_base64_image(data.image)
    
    # Ensure encodings are loaded
    if not face_recognizer._encodings_loaded:
        face_recognizer.load_known_faces()
    
    # Check if any faces are registered
    if len(face_recognizer._known_encodings) == 0:
        return {
            "success": False,
            "message": "Belum ada wajah yang terdaftar dalam sistem.",
            "error_code": "NO_REGISTERED_FACES",
            "absensi": None
        }
    
    # Process frame for face recognition
    results = face_recognizer.process_frame(image)
    
    if not results:
        return {
            "success": False,
            "message": "Tidak ada wajah terdeteksi. Pastikan wajah Anda terlihat jelas di kamera.",
            "error_code": "NO_FACE_DETECTED",
            "absensi": None
        }
    
    # Find recognized face with highest confidence
    recognized = None
    for result in results:
        if result["recognized"]:
            if recognized is None or result["confidence"] > recognized["confidence"]:
                recognized = result
    
    if not recognized:
        return {
            "success": False,
            "message": "Wajah tidak dikenali. Pastikan Anda sudah terdaftar dalam sistem.",
            "error_code": "FACE_NOT_RECOGNIZED",
            "absensi": None
        }
    
    # Get user from database
    user = get_user_by_nim(recognized["id"])
    if not user:
        return {
            "success": False,
            "message": "Data mahasiswa tidak ditemukan dalam database.",
            "error_code": "USER_NOT_FOUND",
            "absensi": None
        }
    
    # ============================================
    # DUPLICATE ATTENDANCE PREVENTION
    # ============================================
    existing_attendance = check_already_attended_today(user["id"])
    if existing_attendance:
        return {
            "success": False,
            "duplicate": True,
            "message": f"Anda sudah melakukan absensi hari ini pada pukul {existing_attendance.get('timestamp', 'N/A')}. Absensi hanya bisa dilakukan sekali per hari.",
            "error_code": "ALREADY_ATTENDED",
            "user": {
                "name": user["name"],
                "nim": user["nim"],
                "kelas": user.get("kelas", "-")
            },
            "existing_attendance": {
                "id": existing_attendance["id"],
                "timestamp": existing_attendance["timestamp"],
                "confidence": existing_attendance.get("confidence"),
                "status": existing_attendance.get("status", "hadir")
            }
        }
    
    # Save photo with face detection box
    # Use WIB timezone for timestamp
    timestamp = get_wib_now()
    photo_filename = f"{user['nim']}_{timestamp.strftime('%Y%m%d_%H%M%S')}.jpg"
    photo_path = OUTPUT_DIR / photo_filename
    
    # Draw bounding box on image
    top, right, bottom, left = recognized["location"]
    cv2.rectangle(image, (left, top), (right, bottom), (0, 255, 0), 2)
    cv2.putText(
        image, 
        f"{user['name']} ({recognized['confidence']:.1f}%)",
        (left, top - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (0, 255, 0),
        2
    )
    
    cv2.imwrite(str(photo_path), image)
    
    # Create absensi record with WIB timestamp
    absensi = create_absensi(
        user_id=user["id"],
        status="hadir",
        confidence=recognized["confidence"],
        photo_path=photo_filename,
        device=data.device_info,
        location=data.location,
        ip_address=client_ip,
        timestamp=timestamp
    )
    
    # Check if duplicate was caught by database
    if isinstance(absensi, dict) and absensi.get("duplicate"):
        existing = absensi.get("existing", {})
        return {
            "success": False,
            "duplicate": True,
            "message": "Anda sudah melakukan absensi hari ini. Absensi hanya bisa dilakukan sekali per hari.",
            "error_code": "ALREADY_ATTENDED",
            "user": {
                "name": user["name"],
                "nim": user["nim"],
                "kelas": user.get("kelas", "-")
            },
            "existing_attendance": existing
        }
    
    # Log activity
    log_activity(
        action="ATTENDANCE_SUCCESS",
        user_id=user["id"],
        entity_type="absensi",
        entity_id=absensi["id"] if absensi else None,
        details=f"Face attendance: confidence={recognized['confidence']:.1f}%",
        ip_address=client_ip
    )
    
    logger.info(f"Absensi recorded: {user['name']} ({user['nim']}) - {recognized['confidence']:.1f}%")
    
    return {
        "success": True,
        "message": f"Absensi berhasil! Selamat datang, {user['name']}",
        "absensi": {
            "id": absensi["id"],
            "name": user["name"],
            "nim": user["nim"],
            "kelas": user.get("kelas", "-"),
            "jurusan": user.get("jurusan", "-"),
            "timestamp": absensi["timestamp"],
            "date": date.today().isoformat(),
            "confidence": round(recognized["confidence"], 2),
            "status": "hadir",
            "photo_path": photo_filename
        }
    }


@router.get("/history/{nim}")
async def get_attendance_history(
    nim: str,
    request: Request,
    limit: int = 30
):
    """
    Get attendance history for a student by NIM.
    No authentication required - students can check their own history.
    """
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(client_ip, limit=60, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Terlalu banyak request. Mohon tunggu sebentar."
        )
    
    # Get user
    user = get_user_by_nim(nim)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mahasiswa dengan NIM tersebut tidak ditemukan"
        )
    
    # Get history
    history = get_absensi_by_nim(nim, limit=limit)
    
    # Get statistics
    stats = get_user_absensi_statistics(user["id"])
    
    return {
        "success": True,
        "user": {
            "name": user["name"],
            "nim": user["nim"],
            "kelas": user.get("kelas", "-"),
            "jurusan": user.get("jurusan", "-")
        },
        "statistics": {
            "total_attendance": stats["total_absensi"],
            "this_month": stats["this_month"],
            "current_streak": stats["current_streak"],
            "attended_today": stats["attended_today"],
            "last_attendance": stats["last_attendance"]
        },
        "history": history,
        "total": len(history)
    }


@router.get("/check-status/{nim}")
async def check_attendance_status(
    nim: str,
    request: Request
):
    """
    Quick check if a student has attended today.
    Useful for showing status before attempting scan.
    """
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(client_ip, limit=120, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Terlalu banyak request."
        )
    
    # Get user
    user = get_user_by_nim(nim)
    if not user:
        return {
            "success": False,
            "found": False,
            "message": "Mahasiswa tidak ditemukan"
        }
    
    # Check today's attendance
    existing = check_already_attended_today(user["id"])
    
    return {
        "success": True,
        "found": True,
        "user": {
            "name": user["name"],
            "nim": user["nim"],
            "kelas": user.get("kelas", "-")
        },
        "attended_today": existing is not None,
        "attendance_record": existing if existing else None
    }


@router.get("/today-stats")
async def get_today_statistics(request: Request):
    """
    Get public statistics for today's attendance.
    Shows total students who have attended today.
    """
    from ..database import get_today_attendance_count, get_absensi_statistics
    
    today_count = get_today_attendance_count()
    stats = get_absensi_statistics()
    
    return {
        "success": True,
        "date": date.today().isoformat(),
        "today_attendance": today_count,
        "total_students": stats["total_students"],
        "registered_faces": stats["registered_faces"],
        "attendance_rate": round((today_count / stats["total_students"] * 100) if stats["total_students"] > 0 else 0, 1)
    }


@router.get("/latest-attendance")
async def get_latest_attendance(
    request: Request,
    limit: int = 50
):
    """
    Get today's attendance records (public, no auth required).
    Shows only today's attendance with user information.
    """
    from ..database import get_today_attendance_list
    
    # Rate limiting
    client_ip = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(client_ip, limit=60, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Terlalu banyak request. Mohon tunggu sebentar."
        )
    
    # Get today's attendance records only
    records = get_today_attendance_list()
    
    # Limit results if needed
    if limit and len(records) > limit:
        records = records[:limit]
    
    return {
        "success": True,
        "records": records,
        "total": len(records),
        "date": date.today().isoformat(),
        "limit": limit
    }
