# =============================================================================
# ABSENSI (ATTENDANCE) ROUTES
# =============================================================================

from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
import numpy as np
import cv2
import base64
import logging
import csv
import io
from pathlib import Path

from .auth import get_current_user, get_admin_user
from ..database import (
    create_absensi,
    get_absensi_by_user,
    get_absensi_today,
    get_all_absensi,
    get_absensi_statistics,
    get_user_absensi_statistics,
    get_face_embedding,
    get_user_by_nim
)
from ..services import FaceRecognizer, LivenessDetector, LivenessChallenge
from ..utils.security import rate_limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/absensi", tags=["Absensi"])

# Initialize recognizer
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

class AbsensiSubmitRequest(BaseModel):
    image: str  # Base64 encoded image
    liveness_verified: bool = False
    device_info: Optional[str] = None
    location: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "image": "base64_encoded_image",
                "liveness_verified": True,
                "device_info": "Chrome/Windows",
                "location": "Lab Komputer"
            }
        }


class AbsensiHistoryQuery(BaseModel):
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    limit: int = Field(default=100, le=1000)
    offset: int = Field(default=0, ge=0)


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
# ROUTES
# =============================================================================

@router.post("/submit")
async def submit_absensi(
    request: Request,
    data: AbsensiSubmitRequest
):
    """
    Submit attendance via face recognition.
    """
    # Rate limiting per IP
    client_ip = request.client.host
    if rate_limiter.is_rate_limited(client_ip, limit=30, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait a moment."
        )
    
    # Decode image
    image = decode_base64_image(data.image)
    
    # Ensure encodings are loaded
    if not face_recognizer._encodings_loaded:
        face_recognizer.load_known_faces()
    
    # Process frame
    results = face_recognizer.process_frame(image)
    
    if not results:
        return {
            "success": False,
            "message": "No face detected in image",
            "absensi": None
        }
    
    # Find recognized face
    recognized = None
    for result in results:
        if result["recognized"]:
            recognized = result
            break
    
    if not recognized:
        return {
            "success": False,
            "message": "Face not recognized. Please register your face first.",
            "absensi": None
        }
    
    # Get user from database
    user = get_user_by_nim(recognized["id"])
    if not user:
        return {
            "success": False,
            "message": "User not found in database",
            "absensi": None
        }
    
    # Check if already submitted today
    today_absensi = get_absensi_today(user["id"])
    if len(today_absensi) > 0:
        # Allow multiple check-ins but warn
        logger.info(f"Multiple absensi today for {user['nim']}")
    
    # Save photo
    timestamp = datetime.now()
    photo_filename = f"{user['name']}_{user['nim']}_{timestamp.strftime('%Y%m%d_%H%M%S')}.jpg"
    photo_path = OUTPUT_DIR / photo_filename
    
    # Draw bounding box
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
    
    # Create absensi record
    absensi = create_absensi(
        user_id=user["id"],
        status="hadir",
        confidence=recognized["confidence"],
        photo_path=photo_filename,
        device=data.device_info,
        location=data.location,
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
            "timestamp": absensi["timestamp"],
            "confidence": round(recognized["confidence"], 2),
            "status": absensi["status"]
        }
    }


@router.get("/history")
async def get_absensi_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0
):
    """
    Get attendance history for current user.
    """
    history = get_absensi_by_user(current_user["id"], limit=limit, offset=offset)
    statistics = get_user_absensi_statistics(current_user["id"])
    
    return {
        "user": {
            "name": current_user["name"],
            "nim": current_user["nim"]
        },
        "statistics": statistics,
        "history": history,
        "total": len(history)
    }


@router.get("/today")
async def get_today_absensi(current_user: dict = Depends(get_current_user)):
    """
    Get today's attendance for current user.
    """
    today = get_absensi_today(current_user["id"])
    
    return {
        "date": date.today().isoformat(),
        "attended": len(today) > 0,
        "records": today
    }


@router.get("/statistics")
async def get_statistics(current_user: dict = Depends(get_current_user)):
    """
    Get attendance statistics for current user.
    """
    stats = get_user_absensi_statistics(current_user["id"])
    
    return {
        "user": {
            "name": current_user["name"],
            "nim": current_user["nim"]
        },
        "statistics": stats
    }


@router.get("/check-status")
async def check_absensi_status(current_user: dict = Depends(get_current_user)):
    """
    Check if user has face registered and today's attendance status.
    """
    face_embedding = get_face_embedding(current_user["id"])
    today_absensi = get_absensi_today(current_user["id"])
    
    return {
        "face_registered": face_embedding is not None,
        "attended_today": len(today_absensi) > 0,
        "today_records": len(today_absensi),
        "last_attendance": today_absensi[0] if today_absensi else None
    }


# =============================================================================
# ADMIN ROUTES
# =============================================================================

@router.get("/admin/all")
async def get_all_attendance(
    admin_user: dict = Depends(get_admin_user),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 1000,
    offset: int = 0
):
    """
    Get all attendance records (admin only).
    """
    records = get_all_absensi(
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset
    )
    
    statistics = get_absensi_statistics(
        date_from=date_from,
        date_to=date_to
    )
    
    return {
        "statistics": statistics,
        "records": records,
        "total": len(records),
        "filters": {
            "date_from": date_from,
            "date_to": date_to
        }
    }


@router.get("/admin/statistics")
async def get_admin_statistics(
    admin_user: dict = Depends(get_admin_user),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """
    Get overall attendance statistics (admin only).
    """
    statistics = get_absensi_statistics(
        date_from=date_from,
        date_to=date_to
    )
    
    return statistics


@router.get("/admin/export")
async def export_attendance(
    admin_user: dict = Depends(get_admin_user),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    format: str = "csv"
):
    """
    Export attendance data to CSV (admin only).
    """
    records = get_all_absensi(
        date_from=date_from,
        date_to=date_to,
        limit=10000
    )
    
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "ID", "NIM", "Nama", "Status", "Confidence", 
            "Waktu", "Device", "Lokasi"
        ])
        
        # Data
        for record in records:
            writer.writerow([
                record.get("id", ""),
                record.get("nim", ""),
                record.get("name", ""),
                record.get("status", ""),
                record.get("confidence", ""),
                record.get("timestamp", ""),
                record.get("device", ""),
                record.get("location", "")
            ])
        
        output.seek(0)
        
        filename = f"absensi_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported export format"
    )


@router.get("/admin/daily-report")
async def get_daily_report(
    admin_user: dict = Depends(get_admin_user),
    report_date: Optional[str] = None
):
    """
    Get daily attendance report (admin only).
    """
    if not report_date:
        report_date = date.today().isoformat()
    
    records = get_all_absensi(
        date_from=report_date,
        date_to=report_date
    )
    
    # Group by user
    user_attendance = {}
    for record in records:
        nim = record.get("nim")
        if nim not in user_attendance:
            user_attendance[nim] = {
                "nim": nim,
                "name": record.get("name"),
                "first_attendance": record.get("timestamp"),
                "last_attendance": record.get("timestamp"),
                "count": 0
            }
        user_attendance[nim]["count"] += 1
        user_attendance[nim]["last_attendance"] = record.get("timestamp")
    
    return {
        "date": report_date,
        "total_records": len(records),
        "unique_users": len(user_attendance),
        "attendees": list(user_attendance.values())
    }
