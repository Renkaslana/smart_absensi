# =============================================================================
# FACE RECOGNITION MODULE
# =============================================================================
# Module ini mengintegrasikan preprocessing, encoding, dan recognition
# dengan dukungan untuk face_recognition library (HOG mode)

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
import logging
from pathlib import Path

# Conditional import for face_recognition
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    logging.warning("face_recognition library not available. Face recognition features will be limited.")

from .preprocessing import FacePreprocessor, FramePreprocessor, create_preprocessor
from .face_encoding import FaceEncodingManager, LBPHEncoder

logger = logging.getLogger(__name__)


class FaceRecognizer:
    """
    High-level face recognition class.
    Integrates preprocessing, detection, encoding, and matching.
    """
    
    def __init__(
        self,
        encodings_dir: str = "encodings",
        use_face_recognition_lib: bool = True,
        recognition_tolerance: float = 0.6,
        min_confidence: float = 60.0,
        encoding_method: str = "face_recognition"
    ):
        """
        Initialize FaceRecognizer.
        
        Args:
            encodings_dir: Directory containing face encodings
            use_face_recognition_lib: Use face_recognition library (recommended)
            recognition_tolerance: Tolerance for face matching (0.6 default)
            min_confidence: Minimum confidence percentage for valid match
            encoding_method: "face_recognition", "lbph", or "hybrid"
        """
        self.encodings_dir = Path(encodings_dir)
        self.use_face_recognition_lib = use_face_recognition_lib
        self.recognition_tolerance = recognition_tolerance
        self.min_confidence = min_confidence
        self.encoding_method = encoding_method
        
        # Initialize components
        self.preprocessor = create_preprocessor("standard")
        self.frame_preprocessor = FramePreprocessor(resize_factor=0.25)
        
        # For hybrid/LBPH mode
        if encoding_method in ["lbph", "hybrid"]:
            self.encoding_manager = FaceEncodingManager(
                encodings_dir=encodings_dir,
                encoding_method="lbph"
            )
        
        # Cache for known faces
        self._known_encodings = []
        self._known_data = []
        self._encodings_loaded = False
        
        logger.info(f"FaceRecognizer initialized (method={encoding_method})")
    
    def load_known_faces(self, min_encodings: int = 3) -> int:
        """
        Load all known face encodings from storage.
        
        Args:
            min_encodings: Minimum encodings per person to be valid
            
        Returns:
            Number of valid encodings loaded
        """
        self._known_encodings = []
        self._known_data = []
        
        encoding_files = list(self.encodings_dir.glob("*.pickle"))
        
        import pickle
        
        for filepath in encoding_files:
            try:
                with open(filepath, "rb") as f:
                    data = pickle.load(f)
                
                # Handle multiple encodings format
                if "encodings" in data and isinstance(data["encodings"], list):
                    encodings = data["encodings"]
                    if len(encodings) >= min_encodings:
                        for i, enc in enumerate(encodings):
                            # Convert to numpy array if needed
                            if isinstance(enc, list):
                                enc = np.array(enc)
                            self._known_encodings.append(enc)
                            self._known_data.append({
                                "nama": data["nama"],
                                "id": data["id"],
                                "encoding_index": i + 1,
                                "total_encodings": len(encodings)
                            })
                
                # Handle single encoding format (backward compatibility)
                elif "encoding" in data:
                    enc = data["encoding"]
                    if isinstance(enc, list):
                        enc = np.array(enc)
                    self._known_encodings.append(enc)
                    self._known_data.append({
                        "nama": data["nama"],
                        "id": data["id"],
                        "encoding_index": 1,
                        "total_encodings": 1
                    })
                    
            except Exception as e:
                logger.error(f"Error loading {filepath}: {e}")
        
        self._encodings_loaded = True
        logger.info(f"Loaded {len(self._known_encodings)} encodings from {len(encoding_files)} files")
        
        return len(self._known_encodings)
    
    def detect_faces(
        self,
        image: np.ndarray,
        model: str = "hog"
    ) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in an image.
        
        Args:
            image: Input image (BGR)
            model: Detection model ("hog" or "cnn")
            
        Returns:
            List of face locations as (top, right, bottom, left)
        """
        if not FACE_RECOGNITION_AVAILABLE:
            logger.warning("face_recognition not available, using OpenCV cascade")
            # Fallback to OpenCV Haar Cascade
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            # Convert to face_recognition format (top, right, bottom, left)
            return [(y, x + w, y + h, x) for (x, y, w, h) in faces]
        
        # Convert to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Ensure contiguous array
        if not rgb_image.flags['C_CONTIGUOUS']:
            rgb_image = np.ascontiguousarray(rgb_image)
        
        # Detect faces using face_recognition library
        face_locations = face_recognition.face_locations(rgb_image, model=model)
        
        return face_locations
    
    def encode_face(
        self,
        image: np.ndarray,
        face_location: Optional[Tuple[int, int, int, int]] = None
    ) -> Optional[np.ndarray]:
        """
        Generate encoding for a face in an image.
        
        Args:
            image: Input image (BGR)
            face_location: Optional face location, auto-detected if None
            
        Returns:
            Face encoding or None if no face found
        """
        if not FACE_RECOGNITION_AVAILABLE:
            logger.warning("face_recognition not available, encoding disabled")
            return None
        
        # Convert to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        if not rgb_image.flags['C_CONTIGUOUS']:
            rgb_image = np.ascontiguousarray(rgb_image)
        
        # Detect face if location not provided
        if face_location is None:
            face_locations = face_recognition.face_locations(rgb_image, model="hog")
            if not face_locations:
                return None
            face_location = [face_locations[0]]
        else:
            face_location = [face_location]
        
        # Generate encoding
        encodings = face_recognition.face_encodings(rgb_image, face_location)
        
        if encodings:
            return encodings[0]
        return None
    
    def encode_faces(
        self,
        image: np.ndarray,
        face_locations: Optional[List[Tuple]] = None
    ) -> List[np.ndarray]:
        """
        Generate encodings for all faces in an image.
        
        Args:
            image: Input image (BGR)
            face_locations: Optional face locations
            
        Returns:
            List of face encodings
        """
        if not FACE_RECOGNITION_AVAILABLE:
            logger.warning("face_recognition not available, encoding disabled")
            return []
        
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        if not rgb_image.flags['C_CONTIGUOUS']:
            rgb_image = np.ascontiguousarray(rgb_image)
        
        if face_locations is None:
            face_locations = face_recognition.face_locations(rgb_image, model="hog")
        
        if not face_locations:
            return []
        
        encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        return encodings
    
    def recognize_face(
        self,
        face_encoding: np.ndarray
    ) -> Optional[Dict[str, Any]]:
        """
        Recognize a face from its encoding.
        
        Args:
            face_encoding: Face encoding to match
            
        Returns:
            Dictionary with match info or None if no match
        """
        if not FACE_RECOGNITION_AVAILABLE:
            logger.warning("face_recognition not available, recognition disabled")
            return None
        
        if not self._encodings_loaded:
            self.load_known_faces()
        
        if not self._known_encodings:
            return None
        
        # Compare with known faces
        matches = face_recognition.compare_faces(
            self._known_encodings,
            face_encoding,
            tolerance=self.recognition_tolerance
        )
        
        face_distances = face_recognition.face_distance(
            self._known_encodings,
            face_encoding
        )
        
        if not any(matches):
            return None
        
        # Find best match
        best_match_idx = np.argmin(face_distances)
        
        if matches[best_match_idx]:
            person_data = self._known_data[best_match_idx]
            distance = face_distances[best_match_idx]
            confidence = (1 - distance) * 100
            
            if confidence >= self.min_confidence:
                return {
                    "nama": person_data["nama"],
                    "id": person_data["id"],
                    "confidence": confidence,
                    "distance": distance
                }
        
        return None
    
    def process_frame(
        self,
        frame: np.ndarray,
        resize_factor: float = 0.25
    ) -> List[Dict[str, Any]]:
        """
        Process a video frame and return detected/recognized faces.
        
        Args:
            frame: Input video frame (BGR)
            resize_factor: Factor to resize frame for performance
            
        Returns:
            List of detected faces with recognition results
        """
        if not self._encodings_loaded:
            self.load_known_faces()
        
        results = []
        
        # Resize for performance
        small_frame = cv2.resize(frame, (0, 0), fx=resize_factor, fy=resize_factor)
        rgb_small = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        if not rgb_small.flags['C_CONTIGUOUS']:
            rgb_small = np.ascontiguousarray(rgb_small)
        
        # Detect faces
        face_locations = face_recognition.face_locations(rgb_small, model="hog")
        
        if not face_locations:
            return results
        
        # Encode faces
        face_encodings = face_recognition.face_encodings(rgb_small, face_locations)
        
        scale_factor = int(1 / resize_factor)
        
        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            # Scale back to original size
            top *= scale_factor
            right *= scale_factor
            bottom *= scale_factor
            left *= scale_factor
            
            result = {
                "location": (top, right, bottom, left),
                "recognized": False,
                "nama": "Unknown",
                "id": None,
                "confidence": 0.0
            }
            
            # Try to recognize
            match = self.recognize_face(face_encoding)
            
            if match:
                result["recognized"] = True
                result["nama"] = match["nama"]
                result["id"] = match["id"]
                result["confidence"] = match["confidence"]
            
            results.append(result)
        
        return results
    
    def register_face(
        self,
        nama: str,
        user_id: str,
        images: List[np.ndarray]
    ) -> Tuple[bool, str]:
        """
        Register a new face with multiple images.
        
        Args:
            nama: Person name
            user_id: Unique ID (NIM)
            images: List of face images
            
        Returns:
            Tuple of (success, message)
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return False, "Library face_recognition tidak tersedia. Silakan install terlebih dahulu."
        
        import pickle
        from datetime import datetime
        
        encodings = []
        
        for i, image in enumerate(images):
            # Preprocess
            preprocessed = self.preprocessor.preprocess(image)
            
            # Encode
            encoding = self.encode_face(preprocessed)
            
            if encoding is not None:
                encodings.append(encoding)
                logger.info(f"Encoded image {i + 1} for {nama}")
            else:
                logger.warning(f"No face found in image {i + 1} for {nama}")
        
        if len(encodings) < 1:
            return False, f"Tidak ada wajah terdeteksi dalam foto. Pastikan foto menunjukkan wajah dengan jelas."
        
        # Save encodings
        encoding_data = {
            "nama": nama,
            "id": user_id,
            "encodings": [enc.tolist() for enc in encodings],
            "jumlah_encoding": len(encodings),
            "tanggal_registrasi": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "format": "multiple",
            "encoding_method": "face_recognition",
            "version": "2.0"
        }
        
        filename = f"{nama}_{user_id}.pickle"
        filepath = self.encodings_dir / filename
        
        with open(filepath, "wb") as f:
            pickle.dump(encoding_data, f)
        
        # Reload known faces
        self.load_known_faces()
        
        return True, f"Registrasi berhasil dengan {len(encodings)} encoding"
    
    def get_registered_users(self) -> List[Dict[str, Any]]:
        """
        Get list of registered users.
        
        Returns:
            List of registered user info
        """
        import pickle
        
        users = []
        encoding_files = list(self.encodings_dir.glob("*.pickle"))
        
        for filepath in encoding_files:
            try:
                with open(filepath, "rb") as f:
                    data = pickle.load(f)
                
                users.append({
                    "nama": data.get("nama", "Unknown"),
                    "id": data.get("id", "Unknown"),
                    "jumlah_encoding": data.get("jumlah_encoding", 1),
                    "tanggal_registrasi": data.get("tanggal_registrasi", "Unknown")
                })
            except Exception as e:
                logger.error(f"Error loading {filepath}: {e}")
        
        return users


class RealtimeFaceRecognizer:
    """
    Optimized face recognizer for real-time video processing.
    Includes tracking to reduce computation.
    """
    
    def __init__(
        self,
        base_recognizer: FaceRecognizer,
        process_every_n_frames: int = 3,
        max_faces: int = 3
    ):
        self.recognizer = base_recognizer
        self.process_every_n_frames = process_every_n_frames
        self.max_faces = max_faces
        
        self.frame_count = 0
        self.last_results = []
        self.tracking_data = {}
    
    def process_frame(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Process frame with optimizations for real-time performance.
        """
        self.frame_count += 1
        
        # Only process every n frames
        if self.frame_count % self.process_every_n_frames == 0:
            results = self.recognizer.process_frame(frame)
            
            # Limit number of faces
            if len(results) > self.max_faces:
                # Sort by face size (larger = more important)
                results.sort(
                    key=lambda r: (r["location"][2] - r["location"][0]) * 
                                  (r["location"][1] - r["location"][3]),
                    reverse=True
                )
                results = results[:self.max_faces]
            
            self.last_results = results
        
        return self.last_results
