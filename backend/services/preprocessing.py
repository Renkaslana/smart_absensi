# =============================================================================
# ENHANCED PREPROCESSING MODULE
# =============================================================================
# Module ini memperbaiki preprocessing wajah dari prototype dengan menambahkan:
# - Face alignment
# - CLAHE (Contrast Limited Adaptive Histogram Equalization)
# - Brightness normalization
# - Noise reduction
# - Advanced image enhancement

import cv2
import numpy as np
from typing import Tuple, Optional, List
import logging
import os

logger = logging.getLogger(__name__)

def get_haarcascade_path(filename: str) -> str:
    """
    Get haarcascade file path compatible with all OpenCV versions.
    
    Args:
        filename: Haarcascade filename (e.g., 'haarcascade_frontalface_default.xml')
        
    Returns:
        Full path to haarcascade file
    """
    # Try cv2.data (OpenCV 3.4+)
    if hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
        return cv2.data.haarcascades + filename
    
    # Try alternative paths
    opencv_path = os.path.dirname(cv2.__file__)
    possible_paths = [
        os.path.join(opencv_path, 'data', 'haarcascades', filename),
        os.path.join(opencv_path, 'share', 'opencv4', 'haarcascades', filename),
        os.path.join(opencv_path, '..', 'share', 'opencv4', 'haarcascades', filename),
        os.path.join(opencv_path, '..', 'data', 'haarcascades', filename),
    ]
    
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            return abs_path
    
    # Fallback: return relative path (might work if installed correctly)
    logger.warning(f"Haarcascade {filename} not found in standard paths, using fallback")
    return filename

class FacePreprocessor:
    """
    Enhanced face preprocessing class untuk meningkatkan kualitas deteksi wajah.
    Memperbaiki kekurangan prototype dengan preprocessing lebih advance.
    """
    
    def __init__(
        self,
        clahe_clip_limit: float = 2.0,
        clahe_tile_grid: Tuple[int, int] = (8, 8),
        target_size: Tuple[int, int] = (200, 200),
        denoise_strength: int = 10
    ):
        """
        Initialize FacePreprocessor.
        
        Args:
            clahe_clip_limit: Contrast limit for CLAHE
            clahe_tile_grid: Tile grid size for CLAHE
            target_size: Target size for face normalization
            denoise_strength: Strength of denoising (0-255)
        """
        self.clahe_clip_limit = clahe_clip_limit
        self.clahe_tile_grid = clahe_tile_grid
        self.target_size = target_size
        self.denoise_strength = denoise_strength
        
        # Initialize CLAHE
        self.clahe = cv2.createCLAHE(
            clipLimit=clahe_clip_limit, 
            tileGridSize=clahe_tile_grid
        )
        
        # Eye cascade for alignment (dlib-free alternative)
        self.eye_cascade = cv2.CascadeClassifier(
            get_haarcascade_path('haarcascade_eye.xml')
        )
        
        # Face cascade for detection
        self.face_cascade = cv2.CascadeClassifier(
            get_haarcascade_path('haarcascade_frontalface_default.xml')
        )
        
        logger.info("FacePreprocessor initialized with enhanced settings")
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """
        Complete preprocessing pipeline.
        
        Args:
            image: Input BGR image
            
        Returns:
            Preprocessed image
        """
        # 1. Convert to grayscale for some operations
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            is_color = True
        else:
            gray = image.copy()
            is_color = False
        
        # 2. Noise reduction
        gray = self.denoise(gray)
        
        # 3. Brightness normalization
        gray = self.normalize_brightness(gray)
        
        # 4. CLAHE enhancement
        gray = self.apply_clahe(gray)
        
        # 5. Convert back to color if needed
        if is_color:
            # Apply enhancement to original color image
            result = self.enhance_color_image(image)
        else:
            result = gray
        
        return result
    
    def denoise(self, image: np.ndarray) -> np.ndarray:
        """
        Apply noise reduction using Non-local Means Denoising.
        
        Args:
            image: Input grayscale image
            
        Returns:
            Denoised image
        """
        if len(image.shape) == 3:
            return cv2.fastNlMeansDenoisingColored(
                image, None, self.denoise_strength, self.denoise_strength, 7, 21
            )
        return cv2.fastNlMeansDenoising(image, None, self.denoise_strength, 7, 21)
    
    def normalize_brightness(self, image: np.ndarray) -> np.ndarray:
        """
        Normalize brightness to reduce variations from lighting conditions.
        
        Args:
            image: Input grayscale image
            
        Returns:
            Brightness-normalized image
        """
        # Calculate current brightness
        mean_brightness = np.mean(image)
        target_brightness = 128  # Target to middle gray
        
        # Adjust brightness
        if mean_brightness > 0:
            scale = target_brightness / mean_brightness
            normalized = np.clip(image * scale, 0, 255).astype(np.uint8)
        else:
            normalized = image
        
        return normalized
    
    def apply_clahe(self, image: np.ndarray) -> np.ndarray:
        """
        Apply CLAHE (Contrast Limited Adaptive Histogram Equalization).
        Improves local contrast while avoiding over-amplification.
        
        Args:
            image: Input grayscale image
            
        Returns:
            CLAHE-enhanced image
        """
        return self.clahe.apply(image)
    
    def enhance_color_image(self, image: np.ndarray) -> np.ndarray:
        """
        Apply enhancement to color image using LAB color space.
        
        Args:
            image: Input BGR image
            
        Returns:
            Enhanced BGR image
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        
        # Split channels
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE to L channel
        l_enhanced = self.clahe.apply(l)
        
        # Merge channels
        lab_enhanced = cv2.merge([l_enhanced, a, b])
        
        # Convert back to BGR
        enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
        
        return enhanced
    
    def detect_and_align_face(
        self, 
        image: np.ndarray,
        expand_ratio: float = 0.2
    ) -> Tuple[Optional[np.ndarray], Optional[Tuple[int, int, int, int]]]:
        """
        Detect face and align based on eye positions.
        
        Args:
            image: Input BGR image
            expand_ratio: Ratio to expand face bounding box
            
        Returns:
            Tuple of (aligned_face, bounding_box) or (None, None) if no face found
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return None, None
        
        # Get largest face
        face_idx = np.argmax([w * h for (x, y, w, h) in faces])
        x, y, w, h = faces[face_idx]
        
        # Expand bounding box
        expand_w = int(w * expand_ratio)
        expand_h = int(h * expand_ratio)
        x = max(0, x - expand_w // 2)
        y = max(0, y - expand_h // 2)
        w = min(image.shape[1] - x, w + expand_w)
        h = min(image.shape[0] - y, h + expand_h)
        
        # Extract face region
        face_region = image[y:y+h, x:x+w]
        face_gray = gray[y:y+h, x:x+w]
        
        # Detect eyes for alignment
        eyes = self.eye_cascade.detectMultiScale(face_gray, scaleFactor=1.1, minNeighbors=5)
        
        if len(eyes) >= 2:
            # Sort eyes by x position
            eyes = sorted(eyes, key=lambda e: e[0])
            
            # Get eye centers
            left_eye = (eyes[0][0] + eyes[0][2] // 2, eyes[0][1] + eyes[0][3] // 2)
            right_eye = (eyes[1][0] + eyes[1][2] // 2, eyes[1][1] + eyes[1][3] // 2)
            
            # Calculate rotation angle
            delta_x = right_eye[0] - left_eye[0]
            delta_y = right_eye[1] - left_eye[1]
            angle = np.degrees(np.arctan2(delta_y, delta_x))
            
            # Rotate face to align eyes horizontally
            center = (w // 2, h // 2)
            rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
            aligned_face = cv2.warpAffine(face_region, rotation_matrix, (w, h))
        else:
            aligned_face = face_region
        
        # Resize to target size
        aligned_face = cv2.resize(aligned_face, self.target_size)
        
        return aligned_face, (x, y, w, h)
    
    def preprocess_face(self, face_image: np.ndarray) -> np.ndarray:
        """
        Complete face preprocessing pipeline.
        
        Args:
            face_image: Cropped face image (BGR)
            
        Returns:
            Preprocessed face ready for encoding
        """
        # 1. Resize to target size
        face = cv2.resize(face_image, self.target_size)
        
        # 2. Denoise
        face = self.denoise(face)
        
        # 3. Enhance using LAB color space
        face = self.enhance_color_image(face)
        
        return face
    
    def batch_preprocess(self, images: List[np.ndarray]) -> List[np.ndarray]:
        """
        Preprocess multiple images.
        
        Args:
            images: List of input images
            
        Returns:
            List of preprocessed images
        """
        return [self.preprocess(img) for img in images]


class FramePreprocessor:
    """
    Specialized preprocessor for real-time video frames.
    Optimized for performance while maintaining quality.
    """
    
    def __init__(
        self,
        resize_factor: float = 0.25,
        enable_denoising: bool = False  # Disabled for performance
    ):
        self.resize_factor = resize_factor
        self.enable_denoising = enable_denoising
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    
    def preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """
        Quick preprocessing for real-time frames.
        
        Args:
            frame: Input BGR frame
            
        Returns:
            Preprocessed frame
        """
        # Resize for performance
        small_frame = cv2.resize(
            frame, 
            (0, 0), 
            fx=self.resize_factor, 
            fy=self.resize_factor
        )
        
        # Convert to RGB (required by face_recognition)
        rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # Ensure contiguous array
        if not rgb_frame.flags['C_CONTIGUOUS']:
            rgb_frame = np.ascontiguousarray(rgb_frame)
        
        return rgb_frame
    
    def enhance_face_region(
        self, 
        frame: np.ndarray, 
        face_location: Tuple[int, int, int, int]
    ) -> np.ndarray:
        """
        Apply enhanced preprocessing to detected face region only.
        
        Args:
            frame: Full frame
            face_location: (top, right, bottom, left) coordinates
            
        Returns:
            Enhanced face region
        """
        top, right, bottom, left = face_location
        face_region = frame[top:bottom, left:right]
        
        # Apply LAB enhancement
        lab = cv2.cvtColor(face_region, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l = self.clahe.apply(l)
        enhanced_lab = cv2.merge([l, a, b])
        enhanced_face = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
        
        return enhanced_face


def create_preprocessor(
    mode: str = "standard",
    **kwargs
) -> FacePreprocessor:
    """
    Factory function to create preprocessor with preset configurations.
    
    Args:
        mode: "standard", "high_quality", or "performance"
        **kwargs: Additional parameters to override
        
    Returns:
        Configured FacePreprocessor instance
    """
    presets = {
        "standard": {
            "clahe_clip_limit": 2.0,
            "clahe_tile_grid": (8, 8),
            "target_size": (200, 200),
            "denoise_strength": 10
        },
        "high_quality": {
            "clahe_clip_limit": 3.0,
            "clahe_tile_grid": (16, 16),
            "target_size": (300, 300),
            "denoise_strength": 15
        },
        "performance": {
            "clahe_clip_limit": 1.5,
            "clahe_tile_grid": (4, 4),
            "target_size": (150, 150),
            "denoise_strength": 5
        }
    }
    
    config = presets.get(mode, presets["standard"])
    config.update(kwargs)
    
    return FacePreprocessor(**config)
