# =============================================================================
# FACE REGISTRATION AND RECOGNITION ROUTES
# =============================================================================

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import numpy as np
import cv2
import base64
import logging
from pathlib import Path
from datetime import datetime
import os

from .auth import get_current_user, get_admin_user
from ..database import (
    save_face_embedding,
    get_face_embedding,
    get_user_by_nim,
    get_user_by_id,
    get_users_with_embeddings,
    delete_face_embedding,
    log_activity
)
from ..services import (
    FaceRecognizer,
    FacePreprocessor,
    create_preprocessor,
    LivenessDetector,
    LivenessChallenge
)
from ..utils.security import sanitize_nim, sanitize_name

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/face", tags=["Face Recognition"])

# Initialize recognizer
ENCODINGS_DIR = Path(__file__).parent.parent.parent / "encodings"
DATASET_DIR = Path(__file__).parent.parent.parent / "dataset_wajah"
ENCODINGS_DIR.mkdir(parents=True, exist_ok=True)
DATASET_DIR.mkdir(parents=True, exist_ok=True)

face_recognizer = FaceRecognizer(
    encodings_dir=str(ENCODINGS_DIR),
    recognition_tolerance=0.55,
    min_confidence=50.0
)

preprocessor = create_preprocessor("standard")
liveness_detector = LivenessDetector()


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class RegisterFaceRequest(BaseModel):
    images: List[str]  # Base64 encoded images
    
    class Config:
        json_schema_extra = {
            "example": {
                "images": ["base64_image_1", "base64_image_2", "base64_image_3"]
            }
        }


# Alternative: Accept FormData with files
@router.post("/register-upload")
async def register_face_upload(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Register face using uploaded files (FormData).
    Alternative endpoint for file uploads.
    """
    if len(files) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 3 face images are required for registration"
        )
    
    # Read and decode images
    images = []
    for i, file in enumerate(files[:10]):  # Max 10 images
        try:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Failed to decode image")
            images.append(img)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to decode image {i + 1}: {str(e)}"
            )
    
    # Register face
    nama = current_user["name"]
    user_id = current_user["nim"]
    
    try:
        success, message = face_recognizer.register_face(nama, user_id, images)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Save to database
        encoding_file = f"{nama}_{user_id}.pickle"
        save_face_embedding(
            user_id=current_user["id"],
            encoding_file=encoding_file,
            num_encodings=len(images)
        )
        
        # Save sample images
        for i, img in enumerate(images[:3]):
            filename = f"{nama}_{user_id}_{i + 1}.jpg"
            filepath = DATASET_DIR / filename
            cv2.imwrite(str(filepath), img)
        
        logger.info(f"Face registered for {nama} ({user_id})")
        
        return {
            "success": True,
            "message": message,
            "num_encodings": len(images)
        }
        
    except Exception as e:
        logger.error(f"Face registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


class ScanFaceRequest(BaseModel):
    image: str  # Base64 encoded image
    require_liveness: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "image": "base64_encoded_image_data",
                "require_liveness": False
            }
        }


class AdminRegisterFaceRequest(BaseModel):
    """Request for admin to register face for a student."""
    student_id: int  # Student database ID
    images: List[str]  # Base64 encoded images
    
    class Config:
        json_schema_extra = {
            "example": {
                "student_id": 1,
                "images": ["base64_image_1", "base64_image_2", "base64_image_3"]
            }
        }


class LivenessCheckRequest(BaseModel):
    image: str  # Base64 encoded image
    challenge_type: str = "blink"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode base64 image to numpy array.
    """
    try:
        # Remove data URL prefix if present
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        
        # Decode
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


def encode_image_base64(image: np.ndarray) -> str:
    """
    Encode numpy array image to base64.
    """
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')


# =============================================================================
# ROUTES
# =============================================================================

@router.post("/register")
async def register_face(
    data: RegisterFaceRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Register face for current user using base64 encoded images.
    Requires at least 3 face images for accurate recognition.
    """
    if len(data.images) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 3 face images are required for registration"
        )
    
    # Decode images
    images = []
    for i, img_base64 in enumerate(data.images[:10]):  # Max 10 images
        try:
            img = decode_base64_image(img_base64)
            images.append(img)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to decode image {i + 1}: {str(e)}"
            )
    
    # Register face
    nama = current_user["name"]
    user_id = current_user["nim"]
    
    try:
        success, message = face_recognizer.register_face(nama, user_id, images)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Save to database
        encoding_file = f"{nama}_{user_id}.pickle"
        save_face_embedding(
            user_id=current_user["id"],
            encoding_file=encoding_file,
            num_encodings=len(images)
        )
        
        # Save sample images
        for i, img in enumerate(images[:3]):
            filename = f"{nama}_{user_id}_{i + 1}.jpg"
            filepath = DATASET_DIR / filename
            cv2.imwrite(str(filepath), img)
        
        logger.info(f"Face registered for {nama} ({user_id})")
        
        return {
            "success": True,
            "message": message,
            "num_encodings": len(images)
        }
        
    except Exception as e:
        logger.error(f"Face registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/register-upload")
async def register_face_upload(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Register face using uploaded files (FormData).
    Alternative endpoint for file uploads.
    """
    if len(files) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 3 face images are required for registration"
        )
    
    # Read and decode images
    images = []
    for i, file in enumerate(files[:10]):  # Max 10 images
        try:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Failed to decode image")
            images.append(img)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to decode image {i + 1}: {str(e)}"
            )
    
    # Register face
    nama = current_user["name"]
    user_id = current_user["nim"]
    
    try:
        success, message = face_recognizer.register_face(nama, user_id, images)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Save to database
        encoding_file = f"{nama}_{user_id}.pickle"
        save_face_embedding(
            user_id=current_user["id"],
            encoding_file=encoding_file,
            num_encodings=len(images)
        )
        
        # Save sample images
        for i, img in enumerate(images[:3]):
            filename = f"{nama}_{user_id}_{i + 1}.jpg"
            filepath = DATASET_DIR / filename
            cv2.imwrite(str(filepath), img)
        
        logger.info(f"Face registered for {nama} ({user_id})")
        
        return {
            "success": True,
            "message": message,
            "num_encodings": len(images)
        }
        
    except Exception as e:
        logger.error(f"Face registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


# =============================================================================
# ADMIN FACE REGISTRATION - Register face for any student
# =============================================================================

@router.post("/admin/register")
async def admin_register_face(
    data: AdminRegisterFaceRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Admin endpoint to register face for a student.
    
    This allows admin to:
    1. Select a student from dropdown
    2. Capture/upload photos of the student (minimum 3 photos)
    3. Register the face encoding
    
    The student doesn't need to login - admin handles registration.
    Requires minimum 3 photos for accurate face recognition.
    """
    # Validate request
    if not data.images or len(data.images) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimal 3 foto wajah diperlukan untuk registrasi yang akurat. Diterima: {len(data.images) if data.images else 0} foto"
        )
    
    if not data.student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="student_id tidak boleh kosong"
        )
    
    # Get student from database
    student = get_user_by_id(data.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mahasiswa dengan ID {data.student_id} tidak ditemukan"
        )
    
    if student.get("role") != "mahasiswa":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hanya bisa mendaftarkan wajah untuk mahasiswa. User ini memiliki role: {student.get('role', 'unknown')}"
        )
    
    # Decode images
    images = []
    for i, img_base64 in enumerate(data.images[:10]):
        try:
            img = decode_base64_image(img_base64)
            images.append(img)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gagal memproses gambar {i + 1}: {str(e)}"
            )
    
    nama = student["name"]
    nim = student["nim"]
    
    try:
        success, message = face_recognizer.register_face(nama, nim, images)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        # Save to database
        encoding_file = f"{nama}_{nim}.pickle"
        save_face_embedding(
            user_id=student["id"],
            encoding_file=encoding_file,
            num_encodings=len(images)
        )
        
        # Save sample images to dataset folder
        student_folder = DATASET_DIR / nim
        student_folder.mkdir(parents=True, exist_ok=True)
        
        for i, img in enumerate(images):
            filename = f"{nim}_{i + 1}.jpg"
            filepath = student_folder / filename
            cv2.imwrite(str(filepath), img)
        
        # Log activity
        log_activity(
            action="REGISTER_FACE",
            user_id=admin_user["id"],
            entity_type="face_embedding",
            entity_id=student["id"],
            details=f"Registered face for {nama} ({nim}) with {len(images)} images"
        )
        
        logger.info(f"Admin {admin_user['nim']} registered face for {nama} ({nim})")
        
        return {
            "success": True,
            "message": f"Wajah {nama} berhasil didaftarkan dengan {len(images)} foto",
            "student": {
                "id": student["id"],
                "nim": nim,
                "name": nama,
                "kelas": student.get("kelas", "-")
            },
            "num_encodings": len(images)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin face registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registrasi wajah gagal: {str(e)}"
        )


@router.post("/admin/register-upload")
async def admin_register_face_upload(
    student_id: int = Form(...),
    files: List[UploadFile] = File(...),
    admin_user: dict = Depends(get_admin_user)
):
    """
    Admin endpoint to register face for a student using file uploads.
    """
    if len(files) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimal 3 foto wajah diperlukan untuk registrasi"
        )
    
    # Get student
    student = get_user_by_id(student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mahasiswa tidak ditemukan"
        )
    
    # Read images
    images = []
    for i, file in enumerate(files[:10]):
        try:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                raise ValueError("Failed to decode")
            images.append(img)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gagal memproses gambar {i + 1}: {str(e)}"
            )
    
    nama = student["name"]
    nim = student["nim"]
    
    try:
        success, message = face_recognizer.register_face(nama, nim, images)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        encoding_file = f"{nama}_{nim}.pickle"
        save_face_embedding(
            user_id=student["id"],
            encoding_file=encoding_file,
            num_encodings=len(images)
        )
        
        # Save images
        student_folder = DATASET_DIR / nim
        student_folder.mkdir(parents=True, exist_ok=True)
        
        for i, img in enumerate(images):
            filepath = student_folder / f"{nim}_{i + 1}.jpg"
            cv2.imwrite(str(filepath), img)
        
        log_activity(
            action="REGISTER_FACE",
            user_id=admin_user["id"],
            entity_type="face_embedding",
            entity_id=student["id"],
            details=f"Registered face for {nama} ({nim})"
        )
        
        return {
            "success": True,
            "message": f"Wajah {nama} berhasil didaftarkan",
            "student": {
                "id": student["id"],
                "nim": nim,
                "name": nama
            },
            "num_encodings": len(images)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin face registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registrasi wajah gagal: {str(e)}"
        )


@router.delete("/admin/unregister/{student_id}")
async def admin_unregister_face(
    student_id: int,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Admin endpoint to remove face registration for a student.
    """
    student = get_user_by_id(student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mahasiswa tidak ditemukan"
        )
    
    nama = student["name"]
    nim = student["nim"]
    
    # Remove encoding file
    encoding_file = ENCODINGS_DIR / f"{nama}_{nim}.pickle"
    if encoding_file.exists():
        os.remove(encoding_file)
    
    # Remove from database
    delete_face_embedding(student_id)
    
    # Reload recognizer
    face_recognizer.load_known_faces()
    
    log_activity(
        action="UNREGISTER_FACE",
        user_id=admin_user["id"],
        entity_type="face_embedding",
        entity_id=student_id,
        details=f"Removed face registration for {nama} ({nim})"
    )
    
    logger.info(f"Admin {admin_user['nim']} unregistered face for {nama} ({nim})")
    
    return {
        "success": True,
        "message": f"Registrasi wajah {nama} berhasil dihapus"
    }


@router.post("/scan")
async def scan_face(data: ScanFaceRequest):
    """
    Scan and recognize a face from image.
    Returns recognized user or unknown.
    """
    # Decode image
    image = decode_base64_image(data.image)
    
    # Ensure encodings are loaded
    if not face_recognizer._encodings_loaded:
        face_recognizer.load_known_faces()
    
    # Process frame
    results = face_recognizer.process_frame(image)
    
    if not results:
        return {
            "recognized": False,
            "message": "No face detected in image",
            "faces": []
        }
    
    faces = []
    for result in results:
        face_data = {
            "location": {
                "top": result["location"][0],
                "right": result["location"][1],
                "bottom": result["location"][2],
                "left": result["location"][3]
            },
            "recognized": result["recognized"],
            "name": result["nama"] if result["recognized"] else "Unknown",
            "nim": result["id"] if result["recognized"] else None,
            "confidence": round(result["confidence"], 2)
        }
        faces.append(face_data)
    
    recognized_faces = [f for f in faces if f["recognized"]]
    
    return {
        "recognized": len(recognized_faces) > 0,
        "message": f"Found {len(faces)} face(s), {len(recognized_faces)} recognized",
        "faces": faces
    }


@router.post("/verify")
async def verify_face(
    data: ScanFaceRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify that the face in image matches current user.
    Used for secure operations requiring face verification.
    """
    # Check if user has registered face
    face_embedding = get_face_embedding(current_user["id"])
    if not face_embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No registered face found. Please register your face first."
        )
    
    # Decode and scan
    image = decode_base64_image(data.image)
    
    if not face_recognizer._encodings_loaded:
        face_recognizer.load_known_faces()
    
    results = face_recognizer.process_frame(image)
    
    if not results:
        return {
            "verified": False,
            "message": "No face detected",
            "confidence": 0
        }
    
    # Check if any detected face matches current user
    for result in results:
        if result["recognized"] and result["id"] == current_user["nim"]:
            return {
                "verified": True,
                "message": "Face verified successfully",
                "confidence": round(result["confidence"], 2)
            }
    
    return {
        "verified": False,
        "message": "Face does not match registered user",
        "confidence": 0
    }


@router.post("/liveness-check")
async def check_liveness(data: LivenessCheckRequest):
    """
    Perform liveness detection on image.
    """
    image = decode_base64_image(data.image)
    
    # Map challenge type
    challenge_map = {
        "blink": LivenessChallenge.BLINK,
        "head_left": LivenessChallenge.HEAD_LEFT,
        "head_right": LivenessChallenge.HEAD_RIGHT,
        "head_up": LivenessChallenge.HEAD_UP,
        "head_down": LivenessChallenge.HEAD_DOWN
    }
    
    challenge = challenge_map.get(data.challenge_type, LivenessChallenge.BLINK)
    
    # Start session if not active
    if liveness_detector.current_challenge == LivenessChallenge.NONE:
        liveness_detector.start_session(challenge)
    
    # Process frame
    result = liveness_detector.process_frame(image)
    
    return {
        "is_live": result["is_live"],
        "challenge": result["challenge"],
        "challenge_completed": result["challenge_completed"],
        "blinks_detected": result.get("blinks_detected", 0),
        "required_blinks": result.get("required_blinks", 2),
        "liveness_score": result.get("liveness_score", 0),
        "message": result.get("message", ""),
        "instruction": liveness_detector.get_challenge_instruction()
    }


@router.post("/liveness-reset")
async def reset_liveness():
    """
    Reset liveness detection session.
    """
    liveness_detector.reset()
    return {"message": "Liveness session reset"}


@router.get("/status")
async def get_face_status(current_user: dict = Depends(get_current_user)):
    """
    Get face registration status for current user.
    """
    face_embedding = get_face_embedding(current_user["id"])
    
    if face_embedding:
        return {
            "registered": True,
            "num_encodings": face_embedding.get("num_encodings", 0),
            "registered_at": face_embedding.get("created_at")
        }
    
    return {
        "registered": False,
        "num_encodings": 0,
        "registered_at": None
    }


@router.get("/registered-users")
async def get_registered_users():
    """
    Get list of users with registered faces.
    """
    users = face_recognizer.get_registered_users()
    return {
        "total": len(users),
        "users": users
    }


@router.delete("/unregister")
async def unregister_face(current_user: dict = Depends(get_current_user)):
    """
    Remove face registration for current user.
    """
    nama = current_user["name"]
    user_id = current_user["nim"]
    
    # Remove encoding file
    encoding_file = ENCODINGS_DIR / f"{nama}_{user_id}.pickle"
    if encoding_file.exists():
        os.remove(encoding_file)
    
    # Remove dataset images
    for i in range(1, 11):
        img_file = DATASET_DIR / f"{nama}_{user_id}_{i}.jpg"
        if img_file.exists():
            os.remove(img_file)
    
    # Reload recognizer
    face_recognizer.load_known_faces()
    
    logger.info(f"Face unregistered for {nama} ({user_id})")
    
    return {
        "success": True,
        "message": "Face registration removed"
    }


@router.post("/detect")
async def detect_faces_only(data: ScanFaceRequest):
    """
    Detect faces in image without recognition.
    Returns face locations only.
    """
    image = decode_base64_image(data.image)
    
    # Detect faces
    face_locations = face_recognizer.detect_faces(image, model="hog")
    
    faces = []
    for top, right, bottom, left in face_locations:
        faces.append({
            "location": {
                "top": top,
                "right": right,
                "bottom": bottom,
                "left": left
            },
            "width": right - left,
            "height": bottom - top
        })
    
    return {
        "detected": len(faces) > 0,
        "count": len(faces),
        "faces": faces
    }
