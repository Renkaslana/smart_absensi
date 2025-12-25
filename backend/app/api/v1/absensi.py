"""
Attendance API Routes
Endpoints for attendance submission, history, and statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.absensi import (
    AbsensiSubmitRequest,
    AbsensiResponse,
    AbsensiHistoryResponse,
    AbsensiStatsResponse,
    TodayAttendanceResponse
)
from app.schemas.common import PaginatedResponse
from app.services.attendance_service import attendance_service
from app.services.face_recognition_service import face_service
from app.utils.image_processing import decode_base64_image
from app.core.exceptions import BadRequestException, DuplicateException

router = APIRouter(prefix="/absensi", tags=["Attendance"])


@router.post("/submit", response_model=AbsensiResponse)
async def submit_attendance(
    request: AbsensiSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit attendance with face recognition.
    User must have registered face first.
    """
    # Check if user has face registered
    if not current_user.has_face:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Face not registered. Please register your face first."
        )
    
    try:
        # Decode image
        image = decode_base64_image(request.image_base64)
        
        # Get user's face encodings
        from app.models.face_encoding import FaceEncoding
        face_encodings_db = db.query(FaceEncoding).filter(
            FaceEncoding.user_id == current_user.id
        ).all()
        
        if not face_encodings_db:
            raise BadRequestException("Face encodings not found. Please re-register your face.")
        
        # Deserialize encodings
        known_encodings = [
            face_service.deserialize_encoding(fe.encoding_data)
            for fe in face_encodings_db
        ]
        
        # Get face encoding from submitted image
        face_encoding = face_service.encode_face(image)
        
        if face_encoding is None:
            raise BadRequestException("No face detected in image. Please try again.")
        
        # Verify face matches user's registered face
        is_match, confidence = face_service.compare_faces(known_encodings, face_encoding)
        
        if not is_match:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Face does not match registered user. Confidence: {confidence:.2%}"
            )
        
        # Save attendance image
        image_path = face_service.save_face_image(
            image,
            current_user.nim,
            index=int(datetime.now().timestamp())
        )
        
        # Submit attendance
        attendance = attendance_service.submit_attendance(
            db=db,
            user_id=current_user.id,
            confidence=confidence,
            image_path=image_path
        )
        
        return AbsensiResponse(
            id=attendance.id,
            user_id=attendance.user_id,
            nim=current_user.nim,
            name=current_user.name,
            date=attendance.date,
            timestamp=attendance.timestamp,
            status=attendance.status,
            confidence=attendance.confidence
        )
        
    except DuplicateException as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except BadRequestException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting attendance: {str(e)}"
        )


@router.get("/history", response_model=PaginatedResponse[AbsensiResponse])
async def get_attendance_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get attendance history for current user.
    Supports pagination and date filtering.
    """
    # Get attendance records
    records = attendance_service.get_user_attendance_history(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        start_date=start_date,
        end_date=end_date
    )
    
    # Count total records
    from app.models.absensi import Absensi
    from sqlalchemy import and_
    
    query = db.query(Absensi).filter(Absensi.user_id == current_user.id)
    if start_date:
        query = query.filter(Absensi.date >= start_date)
    if end_date:
        query = query.filter(Absensi.date <= end_date)
    total = query.count()
    
    # Convert to response models
    items = [
        AbsensiResponse(
            id=record.id,
            user_id=record.user_id,
            nim=current_user.nim,
            name=current_user.name,
            date=record.date,
            timestamp=record.timestamp,
            status=record.status,
            confidence=record.confidence
        )
        for record in records
    ]
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit
    )


@router.get("/today", response_model=TodayAttendanceResponse)
async def get_today_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if user has submitted attendance today.
    """
    attendance = attendance_service.get_today_attendance(db, current_user.id)
    
    if not attendance:
        return TodayAttendanceResponse(
            has_attended=False
        )
    
    return TodayAttendanceResponse(
        has_attended=True,
        attendance=AbsensiResponse(
            id=attendance.id,
            user_id=attendance.user_id,
            nim=current_user.nim,
            name=current_user.name,
            date=attendance.date,
            timestamp=attendance.timestamp,
            status=attendance.status,
            confidence=attendance.confidence
        )
    )


@router.get("/statistics", response_model=AbsensiStatsResponse)
async def get_attendance_statistics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get attendance statistics for current user.
    """
    stats = attendance_service.get_user_statistics(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    
    return AbsensiStatsResponse(**stats)
