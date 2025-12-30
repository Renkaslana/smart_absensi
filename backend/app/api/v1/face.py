"""
Face API Routes
Endpoints for face registration, scanning, and management.

Updated: 30 Dec 2025
- Upgraded to FaceNet embeddings for better accuracy (>90%)
- Using Cosine Similarity instead of Euclidean distance
- Hybrid approach: face_recognition for detection, FaceNet for embeddings
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from PIL import Image
import numpy as np
import cv2

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

# Lazy loading for FaceNet service
_facenet_service = None

def get_facenet():
    """Lazy load FaceNet service on first use."""
    global _facenet_service
    if _facenet_service is None:
        print("🔄 [face.py] Loading FaceNet service (first time)...")
        from app.services.facenet_service import get_facenet_service
        _facenet_service = get_facenet_service(threshold=0.5)
        print("✅ [face.py] FaceNet service loaded!")
    return _facenet_service


@router.post("/scan", response_model=FaceScanResponse)
async def scan_face(
    request: FaceScanRequest,
    db: Session = Depends(get_db)
):
    """
    Scan and recognize face from image using FaceNet + Cosine Similarity.
    Public endpoint (no authentication required).
    
    Algorithm:
    1. Decode base64 image to numpy array
    2. Extract 128D FaceNet embedding from query image
    3. Load all registered face embeddings from database
    4. Calculate cosine similarity with each registered face
    5. Return best match if similarity > threshold (0.5)
    """
    try:
        print("🔍 [face/scan] Starting FaceNet face scan...")
        
        # Decode base64 image to PIL Image
        print("📸 [face/scan] Decoding base64 image...")
        pil_image = decode_base64_image(request.image_base64)
        print(f"✓ [face/scan] PIL Image decoded: {pil_image.size}")
        
        # Convert PIL to OpenCV format (BGR)
        rgb_array = np.array(pil_image)
        if len(rgb_array.shape) == 3 and rgb_array.shape[2] == 3:
            bgr_image = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
        else:
            bgr_image = rgb_array
        print(f"✓ [face/scan] OpenCV image: {bgr_image.shape}")
        
        # Get all face encodings from database
        print("📊 [face/scan] Fetching face encodings from database...")
        face_encodings_db = db.query(FaceEncoding).all()
        print(f"✓ [face/scan] Found {len(face_encodings_db)} face encodings")
        
        if not face_encodings_db:
            print("⚠️ [face/scan] No registered faces in database")
            return FaceScanResponse(
                recognized=False,
                confidence=0.0
            )
        
        # Deserialize encodings and pair with user_id
        # Note: Old face_recognition encodings (128D) are NOT compatible with FaceNet (128D)
        # They have different structures. Users with old encodings need to re-register.
        print("🔓 [face/scan] Deserializing encodings...")
        database_embeddings = []
        incompatible_count = 0
        
        for fe in face_encodings_db:
            try:
                embedding = face_service.deserialize_encoding(fe.encoding_data)
                
                # Validate embedding shape (should be 128D for FaceNet)
                if embedding.shape != (128,):
                    print(f"⚠️ [face/scan] Incompatible encoding for user {fe.user_id}: shape={embedding.shape}")
                    incompatible_count += 1
                    continue
                    
                # Check if embedding is L2 normalized (FaceNet embeddings should be)
                norm = np.linalg.norm(embedding)
                if abs(norm - 1.0) > 0.1:  # Not properly normalized
                    print(f"⚠️ [face/scan] Old format encoding for user {fe.user_id}: norm={norm:.4f}")
                    incompatible_count += 1
                    continue
                    
                database_embeddings.append((fe.user_id, embedding))
            except Exception as e:
                print(f"⚠️ [face/scan] Failed to deserialize encoding for user {fe.user_id}: {e}")
                continue
                
        print(f"✓ [face/scan] Deserialized {len(database_embeddings)} valid FaceNet embeddings")
        if incompatible_count > 0:
            print(f"⚠️ [face/scan] {incompatible_count} old-format encodings skipped (need re-registration)")
        
        if not database_embeddings:
            print("⚠️ [face/scan] No valid FaceNet embeddings to match against")
            # If there were old encodings but no valid ones, give specific message
            if incompatible_count > 0:
                raise BadRequestException(
                    f"Semua {incompatible_count} wajah terdaftar menggunakan format lama. "
                    "Silakan registrasi ulang wajah Anda untuk menggunakan sistem pengenalan baru."
                )
            return FaceScanResponse(
                recognized=False,
                confidence=0.0
            )
        
        # Recognize face using FaceNet
        print("🧠 [face/scan] Starting FaceNet recognition...")
        facenet = get_facenet()
        match = facenet.recognize_face(bgr_image, database_embeddings)
        
        if match is None:
            print("❌ [face/scan] Face not recognized")
            return FaceScanResponse(
                recognized=False,
                confidence=0.0
            )
        
        user_id, confidence = match
        print(f"✓ [face/scan] Match found: user_id={user_id}, confidence={confidence:.4f}")
        
        # Get user info
        print(f"👤 [face/scan] Fetching user info for ID: {user_id}")
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            print(f"❌ [face/scan] User {user_id} not found in database")
            return FaceScanResponse(
                recognized=False,
                confidence=0.0
            )
        
        print(f"✅ [face/scan] Face recognized: {user.name} ({user.nim}) - confidence: {confidence:.2%}")
        return FaceScanResponse(
            recognized=True,
            user_id=user.id,
            nim=user.nim,
            name=user.name,
            kelas=user.kelas,
            confidence=confidence
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
       - Convert to OpenCV format (BGR)
       - Extract 128D FaceNet embedding
       - Save embedding to database
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
        
        # Process each image
        encodings_created = 0
        
        for idx, image_base64 in enumerate(request.images_base64):
            try:
                print(f"📸 [face/register] Processing image {idx + 1}/{len(request.images_base64)}...")
                
                # Decode base64 to PIL Image
                pil_image = decode_base64_image(image_base64)
                
                # Convert PIL to OpenCV format (BGR) for FaceNet
                rgb_array = np.array(pil_image)
                if len(rgb_array.shape) == 3 and rgb_array.shape[2] == 3:
                    bgr_image = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
                else:
                    bgr_image = rgb_array
                
                # Extract FaceNet embedding (128D)
                facenet = get_facenet()
                embedding = facenet.extract_embedding(bgr_image)
                print(f"✓ [face/register] Embedding extracted: shape={embedding.shape}")
                
                # Save image to filesystem
                image_path = face_service.save_face_image(pil_image, current_user.nim, idx)
                print(f"✓ [face/register] Image saved: {image_path}")
                
                # Serialize embedding (convert to bytes)
                encoding_data = face_service.serialize_encoding(embedding)
                
                # Save to database
                face_encoding = FaceEncoding(
                    user_id=current_user.id,
                    encoding_data=encoding_data,
                    image_path=image_path,
                    confidence=1.0  # Self-registration has perfect confidence
                )
                
                db.add(face_encoding)
                encodings_created += 1
                print(f"✓ [face/register] Encoding {idx + 1} saved to database")
                
            except Exception as e:
                print(f"⚠️ [face/register] Failed to process image {idx + 1}: {e}")
                continue
        
        if encodings_created == 0:
            raise BadRequestException("No valid faces detected in any image")
        
        # Update user's has_face status
        current_user.has_face = True
        
        db.commit()
        
        print(f"✅ [face/register] Successfully registered {encodings_created} face encodings for {current_user.name}")
        
        return FaceRegisterResponse(
            success=True,
            message=f"Face registered successfully with {encodings_created} FaceNet encodings",
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
        
        # Process each image
        encodings_created = 0
        
        for idx, image_base64 in enumerate(request.images_base64):
            try:
                print(f"📸 [admin/register] Processing image {idx + 1}/{len(request.images_base64)}...")
                
                # Decode base64 to PIL Image
                pil_image = decode_base64_image(image_base64)
                
                # Convert PIL to OpenCV format (BGR) for FaceNet
                rgb_array = np.array(pil_image)
                if len(rgb_array.shape) == 3 and rgb_array.shape[2] == 3:
                    bgr_image = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
                else:
                    bgr_image = rgb_array
                
                # Extract FaceNet embedding (128D)
                facenet = get_facenet()
                embedding = facenet.extract_embedding(bgr_image)
                print(f"✓ [admin/register] Embedding extracted: shape={embedding.shape}")
                
                # Save image to filesystem
                image_path = face_service.save_face_image(pil_image, user.nim, idx)
                print(f"✓ [admin/register] Image saved: {image_path}")
                
                # Serialize embedding
                encoding_data = face_service.serialize_encoding(embedding)
                
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
        
        print(f"✅ [admin/register] Successfully registered {encodings_created} FaceNet encodings for {user.name}")
        
        return FaceRegisterResponse(
            success=True,
            message=f"Face registered for {user.name} with {encodings_created} FaceNet encodings",
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
