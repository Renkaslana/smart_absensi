"""
Face API Routes
Endpoints for face registration, scanning, and management.

Updated: 30 Dec 2025
- Using face_recognition library (dlib-based) for fast and reliable recognition
- Supports both HOG (fast) and CNN (accurate) models
- Liveness detection handled by frontend (MediaPipe)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from PIL import Image
import numpy as np

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
    Scan and recognize face from image using face_recognition library (dlib).
    Public endpoint (no authentication required).
    
    Algorithm:
    1. Decode base64 image to PIL Image
    2. Extract 128D face encoding using face_recognition
    3. Load all registered face encodings from database
    4. Compare with known faces using Euclidean distance
    5. Return best match if distance < tolerance (0.6)
    """
    try:
        print("🔍 [face/scan] Starting face scan...")
        
        # Decode base64 image to PIL Image
        print("📸 [face/scan] Decoding base64 image...")
        pil_image = decode_base64_image(request.image_base64)
        print(f"✓ [face/scan] PIL Image decoded: {pil_image.size}")
        
        # Extract face encoding from query image
        print("🧠 [face/scan] Extracting face encoding...")
        query_encoding = face_service.encode_face(pil_image)
        
        if query_encoding is None:
            print("❌ [face/scan] No face detected in image")
            return FaceScanResponse(
                recognized=False,
                confidence=0.0,
                message="Tidak ada wajah terdeteksi dalam gambar"
            )
        
        print(f"✓ [face/scan] Encoding extracted: shape={query_encoding.shape}")
        
        # Get all face encodings from database
        print("📊 [face/scan] Fetching face encodings from database...")
        face_encodings_db = db.query(FaceEncoding).all()
        print(f"✓ [face/scan] Found {len(face_encodings_db)} face encodings")
        
        if not face_encodings_db:
            print("⚠️ [face/scan] No registered faces in database")
            return FaceScanResponse(
                recognized=False,
                confidence=0.0,
                message="Belum ada wajah terdaftar dalam sistem"
            )
        
        # Deserialize encodings and group by user_id
        print("🔓 [face/scan] Deserializing encodings...")
        user_encodings = {}  # {user_id: [encodings]}
        
        for fe in face_encodings_db:
            try:
                encoding = face_service.deserialize_encoding(fe.encoding_data)
                if fe.user_id not in user_encodings:
                    user_encodings[fe.user_id] = []
                user_encodings[fe.user_id].append(encoding)
            except Exception as e:
                print(f"⚠️ [face/scan] Failed to deserialize encoding for user {fe.user_id}: {e}")
                continue
        
        print(f"✓ [face/scan] Loaded encodings for {len(user_encodings)} users")
        
        if not user_encodings:
            return FaceScanResponse(
                recognized=False,
                confidence=0.0,
                message="Tidak ada encoding valid dalam database"
            )
        
        # Find best match
        print("🔍 [face/scan] Comparing with registered faces...")
        best_match_id = None
        best_confidence = 0.0
        
        for user_id, encodings in user_encodings.items():
            # Compare with all encodings for this user
            is_match, confidence = face_service.compare_faces(encodings, query_encoding)
            print(f"   • User {user_id}: confidence={confidence:.2%}, match={is_match}")
            
            if is_match and confidence > best_confidence:
                best_confidence = confidence
                best_match_id = user_id
        
        if best_match_id is None:
            print("❌ [face/scan] Face not recognized")
            return FaceScanResponse(
                recognized=False,
                confidence=best_confidence,
                message="Wajah tidak dikenali. Pastikan wajah Anda sudah terdaftar."
            )
        
        # Get user info
        print(f"👤 [face/scan] Fetching user info for ID: {best_match_id}")
        user = db.query(User).filter(User.id == best_match_id).first()
        
        if not user:
            print(f"❌ [face/scan] User {best_match_id} not found in database")
            return FaceScanResponse(
                recognized=False,
                confidence=0.0
            )
        
        print(f"✅ [face/scan] Face recognized: {user.name} ({user.nim}) - confidence: {best_confidence:.2%}")
        return FaceScanResponse(
            recognized=True,
            user_id=user.id,
            nim=user.nim,
            name=user.name,
            kelas=user.kelas,
            confidence=best_confidence
        )
        
    except BadRequestException as e:
        print(f"❌ [face/scan] Bad request: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"❌ [face/scan] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
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
    Register face encodings for current user using FaceNet embeddings.
    Requires at least 3 images for better accuracy.
    
    Process:
    1. Validate image count (3-5 images)
    2. Delete existing encodings for this user
    3. For each image:
       - Decode base64 to PIL Image
       - Extract 128D face encoding using face_recognition library
       - Save encoding to database
       - Save image to filesystem
    4. Update user's has_face status
    """
    print(f"🔐 [face/register] Registering faces for user: {current_user.name} ({current_user.nim})")
    
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
        deleted_count = db.query(FaceEncoding).filter(FaceEncoding.user_id == current_user.id).delete()
        print(f"🗑️ [face/register] Deleted {deleted_count} existing encodings")
        
        # Delete existing face images
        face_service.delete_user_images(current_user.nim)
        
        # Process each image
        encodings_created = 0
        
        for idx, image_base64 in enumerate(request.images_base64):
            try:
                print(f"📸 [face/register] Processing image {idx + 1}/{len(request.images_base64)}...")
                
                # Decode base64 to PIL Image
                pil_image = decode_base64_image(image_base64)
                print(f"✓ [face/register] Image decoded: {pil_image.size}")
                
                # Extract face encoding using face_recognition library (fast!)
                encoding = face_service.encode_face(pil_image)
                
                if encoding is None:
                    print(f"⚠️ [face/register] No face detected in image {idx + 1}")
                    continue
                
                print(f"✓ [face/register] Encoding extracted: shape={encoding.shape}")
                
                # Save image to filesystem
                image_path = face_service.save_face_image(pil_image, current_user.nim, idx)
                print(f"✓ [face/register] Image saved: {image_path}")
                
                # Serialize encoding (convert to bytes)
                encoding_data = face_service.serialize_encoding(encoding)
                
                # Save to database
                face_encoding = FaceEncoding(
                    user_id=current_user.id,
                    encoding_data=encoding_data,
                    image_path=image_path,
                    confidence=1.0  # Self-registration
                )
                
                db.add(face_encoding)
                encodings_created += 1
                print(f"✓ [face/register] Encoding {idx + 1} saved to database")
                
            except Exception as e:
                print(f"⚠️ [face/register] Failed to process image {idx + 1}: {e}")
                continue
        
        if encodings_created == 0:
            db.rollback()
            raise BadRequestException("Tidak ada wajah terdeteksi di foto yang diunggah. Pastikan wajah terlihat jelas.")
        
        # Update user's has_face status
        current_user.has_face = True
        
        db.commit()
        
        print(f"✅ [face/register] Successfully registered {encodings_created} face encodings for {current_user.name}")
        
        return FaceRegisterResponse(
            success=True,
            message=f"Wajah berhasil didaftarkan dengan {encodings_created} encoding",
            encodings_count=encodings_created
        )
        
    except BadRequestException as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"💥 [face/register] Error: {str(e)}")
        import traceback
        traceback.print_exc()
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
    Admin: Register face encodings for any user using FaceNet embeddings.
    Requires admin role.
    """
    # Get target user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    print(f"🔐 [admin/register] Admin registering faces for: {user.name} ({user.nim})")
    
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
        deleted_count = db.query(FaceEncoding).filter(FaceEncoding.user_id == user.id).delete()
        print(f"🗑️ [admin/register] Deleted {deleted_count} existing encodings")
        
        # Process each image using fast face_recognition library (dlib-based)
        encodings_created = 0
        
        for idx, image_base64 in enumerate(request.images_base64):
            try:
                print(f"📸 [admin/register] Processing image {idx + 1}/{len(request.images_base64)}...")
                
                # Decode base64 to PIL Image
                pil_image = decode_base64_image(image_base64)
                
                # Extract face encoding using face_recognition (fast, dlib-based)
                encoding = face_service.encode_face(pil_image)
                
                if encoding is None:
                    print(f"⚠️ [admin/register] No face detected in image {idx + 1}")
                    continue
                    
                print(f"✓ [admin/register] Face encoding extracted: shape={encoding.shape}")
                
                # Save image to filesystem
                image_path = face_service.save_face_image(pil_image, user.nim, idx)
                print(f"✓ [admin/register] Image saved: {image_path}")
                
                # Serialize encoding
                encoding_data = face_service.serialize_encoding(encoding)
                
                # Save to database
                face_encoding = FaceEncoding(
                    user_id=user.id,
                    encoding_data=encoding_data,
                    image_path=image_path,
                    confidence=1.0
                )
                
                db.add(face_encoding)
                encodings_created += 1
                
            except Exception as e:
                print(f"⚠️ [admin/register] Failed to process image {idx + 1}: {e}")
                continue
        
        if encodings_created == 0:
            raise BadRequestException("No valid faces detected in any image")
        
        user.has_face = True
        db.commit()
        
        print(f"✅ [admin/register] Successfully registered {encodings_created} face encodings for {user.name}")
        
        return FaceRegisterResponse(
            success=True,
            message=f"Face registered for {user.name} with {encodings_created} encodings",
            encodings_count=encodings_created
        )
        
    except BadRequestException as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"💥 [admin/register] Error: {str(e)}")
        import traceback
        traceback.print_exc()
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
