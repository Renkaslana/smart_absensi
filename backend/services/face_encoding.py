# =============================================================================
# FACE ENCODING MODULE - Enhanced with LBPH
# =============================================================================
# Module ini meningkatkan encoding wajah dari prototype dengan menambahkan:
# - LBPH (Local Binary Pattern Histogram) - lebih robust
# - Histogram features
# - Combined encoding approach
# - Backward compatible dengan encoding lama

import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict, Any
import pickle
import os
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)


class LBPHEncoder:
    """
    LBPH (Local Binary Pattern Histogram) Face Encoder.
    Lebih robust terhadap variasi pencahayaan dibanding flatten sederhana.
    """
    
    def __init__(
        self,
        radius: int = 1,
        neighbors: int = 8,
        grid_x: int = 8,
        grid_y: int = 8
    ):
        """
        Initialize LBPH Encoder.
        
        Args:
            radius: Radius of circular LBP
            neighbors: Number of neighbors for LBP
            grid_x: Number of horizontal cells
            grid_y: Number of vertical cells
        """
        self.radius = radius
        self.neighbors = neighbors
        self.grid_x = grid_x
        self.grid_y = grid_y
        
        # Initialize OpenCV LBPH recognizer for reference
        self.lbph_recognizer = cv2.face.LBPHFaceRecognizer_create(
            radius=radius,
            neighbors=neighbors,
            grid_x=grid_x,
            grid_y=grid_y
        )
        
        logger.info(f"LBPHEncoder initialized (r={radius}, n={neighbors}, grid={grid_x}x{grid_y})")
    
    def compute_lbp(self, image: np.ndarray) -> np.ndarray:
        """
        Compute Local Binary Pattern for an image.
        
        Args:
            image: Grayscale image
            
        Returns:
            LBP image
        """
        rows, cols = image.shape
        lbp = np.zeros((rows - 2 * self.radius, cols - 2 * self.radius), dtype=np.uint8)
        
        for i in range(self.radius, rows - self.radius):
            for j in range(self.radius, cols - self.radius):
                center = image[i, j]
                binary_string = ""
                
                # Sample points around the center
                for k in range(self.neighbors):
                    angle = 2 * np.pi * k / self.neighbors
                    x = j + self.radius * np.cos(angle)
                    y = i - self.radius * np.sin(angle)
                    
                    # Bilinear interpolation
                    x1, y1 = int(np.floor(x)), int(np.floor(y))
                    x2, y2 = min(x1 + 1, cols - 1), min(y1 + 1, rows - 1)
                    
                    fx, fy = x - x1, y - y1
                    
                    value = (1 - fx) * (1 - fy) * image[y1, x1] + \
                            fx * (1 - fy) * image[y1, x2] + \
                            (1 - fx) * fy * image[y2, x1] + \
                            fx * fy * image[y2, x2]
                    
                    binary_string += "1" if value >= center else "0"
                
                lbp[i - self.radius, j - self.radius] = int(binary_string, 2)
        
        return lbp
    
    def compute_histogram(self, lbp_image: np.ndarray) -> np.ndarray:
        """
        Compute spatial histogram from LBP image.
        
        Args:
            lbp_image: LBP transformed image
            
        Returns:
            Concatenated histogram vector
        """
        rows, cols = lbp_image.shape
        cell_h = rows // self.grid_y
        cell_w = cols // self.grid_x
        
        histograms = []
        
        for i in range(self.grid_y):
            for j in range(self.grid_x):
                # Extract cell
                cell = lbp_image[
                    i * cell_h:(i + 1) * cell_h,
                    j * cell_w:(j + 1) * cell_w
                ]
                
                # Compute histogram
                hist, _ = np.histogram(cell.ravel(), bins=256, range=(0, 256))
                hist = hist.astype(np.float32)
                
                # Normalize
                if np.sum(hist) > 0:
                    hist = hist / np.sum(hist)
                
                histograms.append(hist)
        
        return np.concatenate(histograms)
    
    def encode(self, face_image: np.ndarray) -> np.ndarray:
        """
        Generate LBPH encoding for a face image.
        
        Args:
            face_image: Preprocessed face image (grayscale or BGR)
            
        Returns:
            LBPH feature vector
        """
        # Convert to grayscale if needed
        if len(face_image.shape) == 3:
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_image
        
        # Resize for consistency
        gray = cv2.resize(gray, (200, 200))
        
        # Compute LBP
        lbp_image = self.compute_lbp(gray)
        
        # Compute spatial histogram
        encoding = self.compute_histogram(lbp_image)
        
        return encoding


class HistogramEncoder:
    """
    Enhanced histogram-based face encoder.
    Combines grayscale and gradient histograms for robust encoding.
    """
    
    def __init__(self, bins: int = 256, use_gradient: bool = True):
        self.bins = bins
        self.use_gradient = use_gradient
    
    def encode(self, face_image: np.ndarray) -> np.ndarray:
        """
        Generate histogram-based encoding.
        
        Args:
            face_image: Preprocessed face image
            
        Returns:
            Histogram feature vector
        """
        # Convert to grayscale
        if len(face_image.shape) == 3:
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_image
        
        # Resize
        gray = cv2.resize(gray, (200, 200))
        
        # Intensity histogram
        intensity_hist, _ = np.histogram(gray.ravel(), bins=self.bins, range=(0, 256))
        intensity_hist = intensity_hist.astype(np.float32)
        intensity_hist = intensity_hist / (np.sum(intensity_hist) + 1e-7)
        
        if self.use_gradient:
            # Gradient magnitude histogram
            grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            magnitude = np.sqrt(grad_x**2 + grad_y**2)
            magnitude = (magnitude / magnitude.max() * 255).astype(np.uint8)
            
            gradient_hist, _ = np.histogram(magnitude.ravel(), bins=self.bins, range=(0, 256))
            gradient_hist = gradient_hist.astype(np.float32)
            gradient_hist = gradient_hist / (np.sum(gradient_hist) + 1e-7)
            
            return np.concatenate([intensity_hist, gradient_hist])
        
        return intensity_hist


class FlattenEncoder:
    """
    Enhanced flatten encoder (compatible with prototype).
    Adds smoothing and normalization to original flatten approach.
    """
    
    def __init__(self, target_size: Tuple[int, int] = (100, 100), smooth: bool = True):
        self.target_size = target_size
        self.smooth = smooth
    
    def encode(self, face_image: np.ndarray) -> np.ndarray:
        """
        Generate flattened encoding with enhancements.
        
        Args:
            face_image: Preprocessed face image
            
        Returns:
            Flattened and normalized feature vector
        """
        # Convert to grayscale
        if len(face_image.shape) == 3:
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_image
        
        # Resize
        gray = cv2.resize(gray, self.target_size)
        
        # Optional smoothing
        if self.smooth:
            gray = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Flatten and normalize
        flat = gray.flatten().astype(np.float32)
        flat = (flat - np.mean(flat)) / (np.std(flat) + 1e-7)
        
        return flat


class CombinedEncoder:
    """
    Combined encoder using multiple feature types.
    Provides more robust face representation.
    """
    
    def __init__(self):
        self.lbph_encoder = LBPHEncoder()
        self.histogram_encoder = HistogramEncoder(bins=64)
    
    def encode(self, face_image: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Generate combined encoding using multiple methods.
        
        Args:
            face_image: Preprocessed face image
            
        Returns:
            Dictionary with different encoding types
        """
        return {
            "lbph": self.lbph_encoder.encode(face_image),
            "histogram": self.histogram_encoder.encode(face_image)
        }


class FaceEncodingManager:
    """
    Manager class for face encodings.
    Handles encoding storage, loading, and comparison.
    Compatible with prototype format while supporting new formats.
    """
    
    def __init__(
        self,
        encodings_dir: str = "encodings",
        encoding_method: str = "lbph"
    ):
        """
        Initialize FaceEncodingManager.
        
        Args:
            encodings_dir: Directory to store encodings
            encoding_method: "lbph", "histogram", "flatten", or "combined"
        """
        self.encodings_dir = Path(encodings_dir)
        self.encodings_dir.mkdir(parents=True, exist_ok=True)
        self.encoding_method = encoding_method
        
        # Initialize encoder
        self.encoder = self._create_encoder(encoding_method)
        
        logger.info(f"FaceEncodingManager initialized with {encoding_method} encoder")
    
    def _create_encoder(self, method: str):
        """Create encoder based on method."""
        encoders = {
            "lbph": LBPHEncoder(),
            "histogram": HistogramEncoder(),
            "flatten": FlattenEncoder(),
            "combined": CombinedEncoder()
        }
        return encoders.get(method, LBPHEncoder())
    
    def encode_face(self, face_image: np.ndarray) -> np.ndarray:
        """
        Encode a single face image.
        
        Args:
            face_image: Preprocessed face image
            
        Returns:
            Face encoding vector
        """
        return self.encoder.encode(face_image)
    
    def encode_faces(self, face_images: List[np.ndarray]) -> List[np.ndarray]:
        """
        Encode multiple face images.
        
        Args:
            face_images: List of preprocessed face images
            
        Returns:
            List of face encoding vectors
        """
        return [self.encode_face(img) for img in face_images]
    
    def save_encoding(
        self,
        nama: str,
        user_id: str,
        encodings: List[np.ndarray],
        photos: Optional[List[np.ndarray]] = None
    ) -> str:
        """
        Save face encodings to file.
        
        Args:
            nama: Person name
            user_id: Unique identifier (NIM)
            encodings: List of face encodings
            photos: Optional list of face photos
            
        Returns:
            Path to saved encoding file
        """
        encoding_data = {
            "nama": nama,
            "id": user_id,
            "encodings": encodings,
            "jumlah_encoding": len(encodings),
            "tanggal_registrasi": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "format": "multiple",
            "encoding_method": self.encoding_method,
            "version": "2.0"
        }
        
        filename = f"{nama}_{user_id}.pickle"
        filepath = self.encodings_dir / filename
        
        with open(filepath, "wb") as f:
            pickle.dump(encoding_data, f)
        
        logger.info(f"Saved {len(encodings)} encodings for {nama} ({user_id})")
        
        return str(filepath)
    
    def load_encoding(self, filepath: str) -> Optional[Dict[str, Any]]:
        """
        Load encoding from file.
        
        Args:
            filepath: Path to encoding file
            
        Returns:
            Encoding data dictionary or None if failed
        """
        try:
            with open(filepath, "rb") as f:
                data = pickle.load(f)
            return data
        except Exception as e:
            logger.error(f"Error loading encoding from {filepath}: {e}")
            return None
    
    def load_all_encodings(self, min_encodings: int = 1) -> Tuple[List[np.ndarray], List[Dict]]:
        """
        Load all encodings from directory.
        Compatible with both old (single) and new (multiple) format.
        
        Args:
            min_encodings: Minimum encodings per person to be valid
            
        Returns:
            Tuple of (all_encodings, person_data_list)
        """
        all_encodings = []
        all_data = []
        
        encoding_files = list(self.encodings_dir.glob("*.pickle"))
        
        for filepath in encoding_files:
            data = self.load_encoding(str(filepath))
            if data is None:
                continue
            
            # Handle new format (multiple encodings)
            if "encodings" in data and isinstance(data["encodings"], list):
                encodings = data["encodings"]
                if len(encodings) >= min_encodings:
                    for i, enc in enumerate(encodings):
                        all_encodings.append(enc)
                        all_data.append({
                            "nama": data["nama"],
                            "id": data["id"],
                            "encoding_index": i + 1,
                            "total_encodings": len(encodings)
                        })
            
            # Handle old format (single encoding)
            elif "encoding" in data:
                all_encodings.append(data["encoding"])
                all_data.append({
                    "nama": data["nama"],
                    "id": data["id"],
                    "encoding_index": 1,
                    "total_encodings": 1
                })
        
        logger.info(f"Loaded {len(all_encodings)} encodings from {len(encoding_files)} files")
        
        return all_encodings, all_data
    
    def compare_encodings(
        self,
        encoding1: np.ndarray,
        encoding2: np.ndarray,
        method: str = "euclidean"
    ) -> float:
        """
        Compare two encodings and return distance/similarity.
        
        Args:
            encoding1: First encoding
            encoding2: Second encoding
            method: "euclidean", "cosine", or "chi_square"
            
        Returns:
            Distance score (lower is more similar)
        """
        if method == "euclidean":
            return np.linalg.norm(encoding1 - encoding2)
        
        elif method == "cosine":
            dot = np.dot(encoding1, encoding2)
            norm1 = np.linalg.norm(encoding1)
            norm2 = np.linalg.norm(encoding2)
            return 1 - (dot / (norm1 * norm2 + 1e-7))
        
        elif method == "chi_square":
            return cv2.compareHist(
                encoding1.astype(np.float32),
                encoding2.astype(np.float32),
                cv2.HISTCMP_CHISQR
            )
        
        return float("inf")
    
    def find_best_match(
        self,
        query_encoding: np.ndarray,
        known_encodings: List[np.ndarray],
        known_data: List[Dict],
        threshold: float = 100.0
    ) -> Optional[Tuple[Dict, float, float]]:
        """
        Find best matching person for a query encoding.
        
        Args:
            query_encoding: Encoding to match
            known_encodings: List of known encodings
            known_data: List of person data
            threshold: Maximum distance for valid match
            
        Returns:
            Tuple of (person_data, distance, confidence) or None if no match
        """
        if not known_encodings:
            return None
        
        # Calculate distances
        distances = [
            self.compare_encodings(query_encoding, known_enc)
            for known_enc in known_encodings
        ]
        
        # Find best match
        best_idx = np.argmin(distances)
        best_distance = distances[best_idx]
        
        if best_distance <= threshold:
            # Calculate confidence (inverse of distance, normalized)
            confidence = max(0, (threshold - best_distance) / threshold * 100)
            return known_data[best_idx], best_distance, confidence
        
        return None
