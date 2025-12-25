"""
Face Recognition Service
Handles face detection, encoding, and recognition using face_recognition library.
"""

import os
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
        
        # Compare faces
        face_distances = face_recognition.face_distance(known_encodings, face_encoding)
        
        # Get best match
        best_match_index = np.argmin(face_distances)
        best_distance = face_distances[best_match_index]
        
        # Convert distance to confidence (0-1)
        # Distance 0.0 = 100% match, distance 0.6 = 40% match, distance 1.0 = 0% match
        confidence = max(0.0, 1.0 - best_distance)
        
        # Check if match is within tolerance
        is_match = best_distance <= self.tolerance and confidence >= self.min_confidence
        
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


# Global service instance
face_service = FaceRecognitionService()
