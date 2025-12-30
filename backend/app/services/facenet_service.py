"""
FaceNet Service for Face Recognition

Uses FaceNet (Inception ResNet v1) to generate 128D face embeddings
and Cosine Similarity for matching faces.

Features:
- 128D embedding extraction
- Cosine similarity matching
- L2 normalization
- Configurable threshold

Author: Luna (AbsensiAgent)
"""

from typing import List, Tuple, Optional
import numpy as np
import cv2
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)


class FaceNetService:
    """
    Face recognition service using FaceNet embeddings
    and cosine similarity matching.
    
    This service provides:
    1. Image preprocessing for FaceNet input
    2. Face embedding extraction (128D vectors)
    3. Similarity-based face matching
    """
    
    _instance = None
    _model = None
    
    def __new__(cls, *args, **kwargs):
        """Singleton pattern to avoid loading model multiple times."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self, similarity_threshold: float = 0.5):
        """
        Initialize FaceNet model.
        
        Args:
            similarity_threshold: Minimum cosine similarity for match (0.0-1.0)
                                 Lower = more lenient, Higher = more strict
                                 Default 0.5 for better recall
        """
        if FaceNetService._model is None:
            print("🔄 [FaceNet] Loading FaceNet model...")
            try:
                from keras_facenet import FaceNet
                FaceNetService._model = FaceNet()
                print("✅ [FaceNet] Model loaded successfully!")
            except Exception as e:
                print(f"❌ [FaceNet] Failed to load model: {e}")
                raise
        
        self.model = FaceNetService._model
        self.threshold = similarity_threshold
        logger.info(f"✓ FaceNet service initialized, threshold={self.threshold}")
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for FaceNet.
        
        Args:
            image: BGR image from OpenCV (any size)
            
        Returns:
            Preprocessed image (160x160x3, normalized to [-1, 1])
        """
        # Convert BGR to RGB
        if len(image.shape) == 3 and image.shape[2] == 3:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            rgb_image = image
        
        # Resize to FaceNet input size (160x160)
        resized = cv2.resize(rgb_image, (160, 160), interpolation=cv2.INTER_LINEAR)
        
        # Normalize to [-1, 1] range (FaceNet expects this)
        normalized = (resized.astype(np.float32) - 127.5) / 128.0
        
        return normalized
    
    def extract_embedding(self, image: np.ndarray) -> np.ndarray:
        """
        Extract 128D face embedding from image.
        
        Args:
            image: BGR image containing a face (any size)
            
        Returns:
            128D embedding vector (L2 normalized)
        """
        # Preprocess image
        preprocessed = self.preprocess_image(image)
        
        # Add batch dimension [1, 160, 160, 3]
        image_batch = np.expand_dims(preprocessed, axis=0)
        
        # Extract embedding using FaceNet
        embedding = self.model.embeddings(image_batch)[0]
        
        # L2 normalization for cosine similarity
        norm = np.linalg.norm(embedding)
        if norm > 0:
            normalized_embedding = embedding / norm
        else:
            normalized_embedding = embedding
        
        logger.debug(f"✓ Extracted embedding: shape={normalized_embedding.shape}, norm={norm:.4f}")
        
        return normalized_embedding
    
    def calculate_similarity(
        self, 
        embedding1: np.ndarray, 
        embedding2: np.ndarray
    ) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First face embedding (128D)
            embedding2: Second face embedding (128D)
            
        Returns:
            Cosine similarity score (0.0 to 1.0)
        """
        # Reshape for sklearn
        vec1 = embedding1.reshape(1, -1)
        vec2 = embedding2.reshape(1, -1)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(vec1, vec2)[0][0]
        
        # Clamp to [0, 1] range (cosine can be negative for opposite vectors)
        similarity = max(0.0, min(1.0, similarity))
        
        return float(similarity)
    
    def find_best_match(
        self, 
        query_embedding: np.ndarray, 
        database_embeddings: List[Tuple[int, np.ndarray]]
    ) -> Optional[Tuple[int, float]]:
        """
        Find best matching face from database.
        
        Args:
            query_embedding: Query face embedding (128D)
            database_embeddings: List of (user_id, embedding) tuples
            
        Returns:
            (user_id, confidence) if match found above threshold, else None
        """
        if not database_embeddings:
            logger.warning("❌ No database embeddings to match against")
            return None
        
        best_match_id = None
        best_similarity = -1.0
        
        print(f"🔍 [FaceNet] Comparing against {len(database_embeddings)} registered faces...")
        
        # Calculate similarity with each database embedding
        for user_id, db_embedding in database_embeddings:
            similarity = self.calculate_similarity(query_embedding, db_embedding)
            
            print(f"   • User {user_id}: similarity = {similarity:.4f}")
            
            if similarity > best_similarity:
                best_similarity = similarity
                best_match_id = user_id
        
        # Check if best match exceeds threshold
        if best_similarity >= self.threshold:
            print(f"✅ [FaceNet] Match found: user_id={best_match_id}, confidence={best_similarity:.4f}")
            return (best_match_id, best_similarity)
        else:
            print(f"❌ [FaceNet] No match above threshold ({best_similarity:.4f} < {self.threshold})")
            return None
    
    def recognize_face(
        self, 
        image: np.ndarray, 
        database_embeddings: List[Tuple[int, np.ndarray]]
    ) -> Optional[Tuple[int, float]]:
        """
        Complete face recognition pipeline.
        
        Args:
            image: BGR image containing face (from webcam)
            database_embeddings: List of (user_id, embedding) registered in database
            
        Returns:
            (user_id, confidence) if recognized, else None
        """
        try:
            print("🧠 [FaceNet] Extracting face embedding...")
            
            # Extract embedding from query image
            query_embedding = self.extract_embedding(image)
            
            print(f"✓ [FaceNet] Embedding extracted: {query_embedding.shape}")
            
            # Find best match in database
            match = self.find_best_match(query_embedding, database_embeddings)
            
            return match
            
        except Exception as e:
            print(f"💥 [FaceNet] Recognition error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def verify_faces(
        self,
        image1: np.ndarray,
        image2: np.ndarray
    ) -> Tuple[bool, float]:
        """
        Verify if two images contain the same person.
        
        Args:
            image1: First face image (BGR)
            image2: Second face image (BGR)
            
        Returns:
            Tuple of (is_same_person, similarity_score)
        """
        try:
            # Extract embeddings
            embedding1 = self.extract_embedding(image1)
            embedding2 = self.extract_embedding(image2)
            
            # Calculate similarity
            similarity = self.calculate_similarity(embedding1, embedding2)
            
            # Check threshold
            is_same = similarity >= self.threshold
            
            return (is_same, similarity)
            
        except Exception as e:
            logger.error(f"Face verification error: {e}")
            return (False, 0.0)


# Create global instance (lazy loading)
_facenet_service: Optional[FaceNetService] = None


def get_facenet_service(threshold: float = 0.5) -> FaceNetService:
    """
    Get or create FaceNet service instance.
    
    Args:
        threshold: Similarity threshold for matching (0.0-1.0)
        
    Returns:
        FaceNetService instance
    """
    global _facenet_service
    if _facenet_service is None:
        _facenet_service = FaceNetService(similarity_threshold=threshold)
    return _facenet_service
