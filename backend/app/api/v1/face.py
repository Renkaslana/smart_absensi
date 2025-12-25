"""
Face API Routes
Endpoints for face registration, scanning, and management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from PIL import Image

from app.api.deps import get_current_user, get_current_admin, get_db
from app.models.user import User
from app.models.face_encoding import FaceEncoding
from app.schemas.face import (
    FaceScanRequest,
    FaceRegisterRequest,
    FaceScanResponse,
    FaceRegisterResponse,
    FaceStatusResponse
)
from app.schemas.common import ResponseBase
from app.services.face_recognition_service import face_service
from app.utils.image_processing import decode_base64_image
from app.core.exceptions import BadRequestException, NotFoundException

router = APIRouter(prefix="/face", tags=["Face Recognition"])


@router.post("/scan", response_model=FaceScanResponse)
async def scan_face(
    request: FaceScanRequest,
    db: Session = Depends(get_db)
):
    """
    Scan and recognize face from image.
    Public endpoint (no authentication required).
    """
    try:
        # Decode image
        image = decode_base64_image(request.image_base64)
        
        # Get all face encodings from database
        face_encodings_db = db.query(FaceEncoding).all()
        
        if not face_encodings_db:
            raise BadRequestException("No registered faces in database")
        
        # Deserialize encodings
        known_encodings = [
            face_service.deserialize_encoding(fe.encoding_data)
            for fe in face_encodings_db
        ]
        user_ids = [fe.user_id for fe in face_encodings_db]
        
        # Recognize face
        result = face_service.recognize_face(image, known_encodings, user_ids)
        
        if result is None:
            return FaceScanResponse(
                recognized=False,
                confidence=0.0
            )
        
        # Get user info
        user = db.query(User).filter(User.id == result["user_id"]).first()
        
        return FaceScanResponse(
            recognized=True,
            user_id=user.id,
            nim=user.nim,
            name=user.name,
            kelas=user.kelas,
            confidence=result["confidence"]
        )
        
    except BadRequestException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face recognition error: {str(e)}"
        )


@router.post("/register", response_model=FaceRegisterResponse)
async def register_face(
    request: FaceRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register face encodings for current user.
    Requires at least 3 images for better accuracy.
    """
    if len(request.images_base64) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 3 images required for face registration"
        )
    
    if len(request.images_base64) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 images allowed"
        )
    
    try:
        # Delete existing face encodings
        db.query(FaceEncoding).filter(FaceEncoding.user_id == current_user.id).delete()
        
        # Process each image
        encodings_created = 0
        
        for idx, image_base64 in enumerate(request.images_base64):
            # Decode image
            image = decode_base64_image(image_base64)
            
            # Generate encoding
            encoding = face_service.encode_face(image)
            
            if encoding is None:
                continue  # Skip if no face detected
            
            # Save image
            image_path = face_service.save_face_image(image, current_user.nim, idx)
            
            # Serialize encoding
            encoding_data = face_service.serialize_encoding(encoding)
            
            # Save to database
            face_encoding = FaceEncoding(
                user_id=current_user.id,
                encoding_data=encoding_data,
                image_path=image_path,
                confidence=1.0  # Self-registration has perfect confidence
            )
            
            db.add(face_encoding)
            encodings_created += 1
        
        if encodings_created == 0:
            raise BadRequestException("No valid faces detected in any image")
        
        # Update user's has_face status
        current_user.has_face = True
        
        db.commit()
        
        return FaceRegisterResponse(
            success=True,
            message=f"Face registered successfully with {encodings_created} encodings",
            encodings_count=encodings_created
        )
        
    except BadRequestException as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face registration error: {str(e)}"
        )


@router.get("/status", response_model=FaceStatusResponse)
async def get_face_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get face registration status for current user."""
    encodings_count = db.query(FaceEncoding).filter(
        FaceEncoding.user_id == current_user.id
    ).count()
    
    return FaceStatusResponse(
        has_face=current_user.has_face,
        encodings_count=encodings_count
    )


@router.delete("/unregister", response_model=ResponseBase)
async def unregister_face(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove face data for current user."""
    try:
        # Delete face encodings from database
        deleted = db.query(FaceEncoding).filter(
            FaceEncoding.user_id == current_user.id
        ).delete()
        
        if deleted == 0:
            raise NotFoundException("No face data found")
        
        # Update user's has_face status
        current_user.has_face = False
        
        # Delete face images
        face_service.delete_user_images(current_user.nim)
        
        db.commit()
        
        return ResponseBase(
            success=True,
            message="Face data removed successfully"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing face data: {str(e)}"
        )


# Admin endpoints
@router.post("/admin/register/{user_id}", response_model=FaceRegisterResponse)
async def admin_register_face(
    user_id: int,
    request: FaceRegisterRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Register face encodings for any user.
    Requires admin role.
    """
    # Get target user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    if len(request.images_base64) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 3 images required for face registration"
        )
    
    try:
        # Delete existing face encodings
        db.query(FaceEncoding).filter(FaceEncoding.user_id == user.id).delete()
        
        # Process each image
        encodings_created = 0
        
        for idx, image_base64 in enumerate(request.images_base64):
            image = decode_base64_image(image_base64)
            encoding = face_service.encode_face(image)
            
            if encoding is None:
                continue
            
            image_path = face_service.save_face_image(image, user.nim, idx)
            encoding_data = face_service.serialize_encoding(encoding)
            
            face_encoding = FaceEncoding(
                user_id=user.id,
                encoding_data=encoding_data,
                image_path=image_path,
                confidence=1.0
            )
            
            db.add(face_encoding)
            encodings_created += 1
        
        if encodings_created == 0:
            raise BadRequestException("No valid faces detected in any image")
        
        user.has_face = True
        db.commit()
        
        return FaceRegisterResponse(
            success=True,
            message=f"Face registered for {user.name} with {encodings_created} encodings",
            encodings_count=encodings_created
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Face registration error: {str(e)}"
        )


@router.delete("/admin/unregister/{user_id}", response_model=ResponseBase)
async def admin_unregister_face(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Admin: Remove face data for any user.
    Requires admin role.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    try:
        deleted = db.query(FaceEncoding).filter(FaceEncoding.user_id == user.id).delete()
        
        if deleted == 0:
            raise NotFoundException("No face data found for this user")
        
        user.has_face = False
        face_service.delete_user_images(user.nim)
        
        db.commit()
        
        return ResponseBase(
            success=True,
            message=f"Face data removed for {user.name}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing face data: {str(e)}"
        )
