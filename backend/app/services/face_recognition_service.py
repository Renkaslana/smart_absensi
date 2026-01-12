"""
Face Recognition Service
Handles face detection, encoding, and recognition using face_recognition library.
"""

import os
import io
import pickle
import numpy as np
import face_recognition
from typing import List, Tuple, Optional, Dict
from PIL import Image
from datetime import datetime

from app.core.config import settings
from app.core.exceptions import BadRequestException, FaceNotRecognizedException
from app.utils.image_processing import decode_base64_image, image_to_numpy, resize_image, validate_image_quality
from app.utils.helpers import ensure_directory_exists, generate_filename


class FaceRecognitionService:
    """Service for face detection, encoding, and recognition."""
    
    def __init__(self):
        self.model = settings.FACE_DETECTION_MODEL  # "hog" or "cnn"
        self.tolerance = settings.FACE_RECOGNITION_TOLERANCE  # 0.6 default
        self.min_confidence = settings.FACE_MIN_CONFIDENCE  # 0.8 default
    
    def detect_faces(self, image: Image.Image) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image.
        
        Args:
            image: PIL Image object
            
        Returns:
            List of face locations [(top, right, bottom, left), ...]
        """
        # Convert to numpy array
        img_array = image_to_numpy(image)
        
        # Detect faces
        face_locations = face_recognition.face_locations(img_array, model=self.model)
        
        return face_locations
    
    def encode_face(self, image: Image.Image) -> Optional[np.ndarray]:
        """
        Generate face encoding from image.
        
        Args:
            image: PIL Image object
            
        Returns:
            Face encoding as numpy array (128D) or None if no face detected
        """
        # Validate image quality
        is_valid, error_msg = validate_image_quality(image)
        if not is_valid:
            raise BadRequestException(error_msg)
        
        # Resize if too large
        if image.width > 1280 or image.height > 720:
            image = resize_image(image, (1280, 720))
        
        # Convert to numpy
        img_array = image_to_numpy(image)
        
        # Get face encodings
        encodings = face_recognition.face_encodings(img_array, model="large")
        
        if len(encodings) == 0:
            return None
        
        # Return first face encoding
        return encodings[0]
    
    def encode_multiple_faces(self, images: List[Image.Image]) -> List[np.ndarray]:
        """
        Generate face encodings from multiple images.
        
        Args:
            images: List of PIL Image objects
            
        Returns:
            List of face encodings
        """
        encodings = []
        
        for img in images:
            encoding = self.encode_face(img)
            if encoding is not None:
                encodings.append(encoding)
        
        return encodings
    
    def compare_faces(
        self,
        known_encodings: List[np.ndarray],
        face_encoding: np.ndarray
    ) -> Tuple[bool, float]:
        """
        Compare a face encoding against known encodings.
        
        Args:
            known_encodings: List of known face encodings
            face_encoding: Face encoding to compare
            
        Returns:
            Tuple of (is_match, confidence)
        """
        if len(known_encodings) == 0:
            return False, 0.0
        
        # Compare faces using face_recognition library
        face_distances = face_recognition.face_distance(known_encodings, face_encoding)
        
        # Get best match (minimum distance)
        best_match_index = np.argmin(face_distances)
        best_distance = float(face_distances[best_match_index])
        
        # In face_recognition library:
        # - Distance 0.0 = exact match (100%)
        # - Distance 0.4 = good match (~85%)
        # - Distance 0.5 = acceptable (~75%)
        # - Distance 0.6 = threshold (~65%)
        # - Distance > 0.6 = not a match
        
        # Convert distance to confidence percentage for user-friendly display
        # Using linear interpolation: distance 0 -> 100%, distance 0.6 -> 60%
        # This provides a more intuitive confidence score for users
        if best_distance <= 0.0:
            confidence = 1.0
        elif best_distance >= 0.8:
            confidence = 0.4  # Minimum 40% for very poor matches
        else:
            # Linear scale: 100% at distance 0, 60% at distance 0.6
            # Formula: confidence = 1.0 - (distance * 0.667)
            # This maps: 0.0 -> 100%, 0.3 -> 80%, 0.45 -> 70%, 0.6 -> 60%
            confidence = max(0.4, 1.0 - (best_distance * 0.67))
        
        # Match if distance is within tolerance
        is_match = best_distance <= self.tolerance
        
        print(f"   📊 Distance: {best_distance:.4f}, Confidence: {confidence:.2%}, Tolerance: {self.tolerance}, Match: {is_match}")
        
        return is_match, confidence
    
    def recognize_face(
        self,
        image: Image.Image,
        known_encodings: List[np.ndarray],
        user_ids: List[int]
    ) -> Optional[Dict]:
        """
        Recognize face in image against known encodings.
        
        Args:
            image: PIL Image object
            known_encodings: List of known face encodings
            user_ids: List of user IDs corresponding to encodings
            
        Returns:
            Dict with user_id and confidence, or None if not recognized
        """
        # Get face encoding from image
        face_encoding = self.encode_face(image)
        
        if face_encoding is None:
            raise BadRequestException("No face detected in image")
        
        # Group encodings by user
        user_encoding_map = {}
        for user_id, encoding in zip(user_ids, known_encodings):
            if user_id not in user_encoding_map:
                user_encoding_map[user_id] = []
            user_encoding_map[user_id].append(encoding)
        
        # Find best match across all users
        best_user_id = None
        best_confidence = 0.0
        
        for user_id, encodings in user_encoding_map.items():
            is_match, confidence = self.compare_faces(encodings, face_encoding)
            
            if is_match and confidence > best_confidence:
                best_user_id = user_id
                best_confidence = confidence
        
        if best_user_id is None:
            return None
        
        return {
            "user_id": best_user_id,
            "confidence": best_confidence
        }
    
    def save_face_image(
        self,
        image: Image.Image,
        user_nim: str,
        index: int = 0
    ) -> str:
        """
        Save face image to storage.
        
        Args:
            image: PIL Image object
            user_nim: User's NIM
            index: Image index
            
        Returns:
            Relative path to saved image
        """
        # Create user directory
        user_dir = os.path.join(settings.FACE_STORAGE_PATH, user_nim)
        ensure_directory_exists(user_dir)
        
        # Generate filename
        filename = f"{user_nim}_{index}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        filepath = os.path.join(user_dir, filename)
        
        # Save image
        if image.mode != "RGB":
            image = image.convert("RGB")
        image.save(filepath, "JPEG", quality=90, optimize=True)
        
        # Return relative path
        return os.path.join(user_nim, filename)
    
    def serialize_encoding(self, encoding: np.ndarray) -> bytes:
        """
        Serialize face encoding for database storage.
        
        Args:
            encoding: Face encoding numpy array
            
        Returns:
            Serialized bytes
        """
        return pickle.dumps(encoding)
    
    def deserialize_encoding(self, data: bytes) -> np.ndarray:
        """
        Deserialize face encoding from database.
        
        Args:
            data: Serialized bytes
            
        Returns:
            Face encoding numpy array
        """
        return pickle.loads(data)
    
    def delete_user_images(self, user_nim: str) -> None:
        """
        Delete all face images for a user.
        
        Args:
            user_nim: User's NIM
        """
        user_dir = os.path.join(settings.FACE_STORAGE_PATH, user_nim)
        
        if os.path.exists(user_dir):
            import shutil
            shutil.rmtree(user_dir)
    
    def register_face(self, user_id: int, image_data: bytes, filename: str) -> Dict:
        """
        Register a face photo for a user.
        Process image, validate quality, extract encoding, and save.
        
        Args:
            user_id: User database ID
            image_data: Raw image bytes
            filename: Original filename
            
        Returns:
            Dict with encoding_id, image_path, quality_score
            
        Raises:
            ValueError: If image processing fails or no face detected
        """
        from app.db.session import SessionLocal
        from app.models.user import User
        from app.models.face_encoding import FaceEncoding
        
        # Decode image from bytes
        try:
            image = Image.open(io.BytesIO(image_data))
            if image.mode != 'RGB':
                image = image.convert('RGB')
        except Exception as e:
            raise ValueError(f"Invalid image format: {str(e)}")
        
        # Validate image quality
        is_valid, error_msg = validate_image_quality(image)
        if not is_valid:
            raise ValueError(error_msg)
        
        # Encode face
        encoding = self.encode_face(image)
        if encoding is None:
            raise ValueError("No face detected in image. Please ensure your face is clearly visible.")
        
        # Get user info for saving image
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")
            
            # Save face image
            image_path = self.save_face_image(
                image=image,
                user_nim=user.nim,
                index=int(datetime.now().timestamp())
            )
            
            # Calculate quality score (simple metric based on image size and detection)
            quality_score = min(100, int((image.width * image.height) / 10000))
            
            # Save encoding to database
            face_encoding = FaceEncoding(
                user_id=user_id,
                encoding_data=self.serialize_encoding(encoding),
                image_path=image_path,
                confidence=quality_score / 100.0,  # Use confidence field for quality (0.0-1.0)
                created_at=datetime.now()
            )
            
            db.add(face_encoding)
            db.commit()
            db.refresh(face_encoding)
            
            # Update user has_face flag
            count = db.query(FaceEncoding).filter(FaceEncoding.user_id == user_id).count()
            if count >= 3:
                user.has_face = True
                db.commit()
            
            return {
                "encoding_id": face_encoding.id,
                "image_path": image_path,
                "quality_score": quality_score
            }
            
        finally:
            db.close()


# Global service instance
face_service = FaceRecognitionService()
