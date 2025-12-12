# =============================================================================
# LIVENESS DETECTION MODULE
# =============================================================================
# Module ini mengimplementasikan liveness detection untuk keamanan:
# - Eye Aspect Ratio (EAR) untuk blink detection
# - Head movement challenge
# - Light intensity change detection
# - Anti-spoofing tanpa CNN berat

import cv2
import numpy as np
from typing import Tuple, Optional, Dict, List, Any
from enum import Enum
import time
import logging
from collections import deque

logger = logging.getLogger(__name__)


class LivenessChallenge(Enum):
    """Types of liveness challenges"""
    BLINK = "blink"
    HEAD_LEFT = "head_left"
    HEAD_RIGHT = "head_right"
    HEAD_UP = "head_up"
    HEAD_DOWN = "head_down"
    NONE = "none"


class EyeAspectRatioCalculator:
    """
    Calculate Eye Aspect Ratio (EAR) for blink detection.
    Uses facial landmarks to detect eye openness.
    """
    
    def __init__(self):
        # Eye landmark indices (for 68-point facial landmarks)
        # Left eye: 36-41, Right eye: 42-47
        self.LEFT_EYE_INDICES = list(range(36, 42))
        self.RIGHT_EYE_INDICES = list(range(42, 48))
        
        # Initialize face detector and landmark predictor
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_eye.xml'
        )
    
    def calculate_ear(self, eye_points: np.ndarray) -> float:
        """
        Calculate Eye Aspect Ratio from eye landmarks.
        
        EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
        
        Args:
            eye_points: Array of 6 eye landmark points
            
        Returns:
            Eye Aspect Ratio value
        """
        # Compute euclidean distances
        # Vertical distances
        A = np.linalg.norm(eye_points[1] - eye_points[5])
        B = np.linalg.norm(eye_points[2] - eye_points[4])
        
        # Horizontal distance
        C = np.linalg.norm(eye_points[0] - eye_points[3])
        
        # Calculate EAR
        ear = (A + B) / (2.0 * C + 1e-6)
        
        return ear
    
    def detect_eyes(self, face_region: np.ndarray) -> Tuple[bool, float]:
        """
        Detect eyes in face region and estimate EAR.
        Uses Haar cascades when dlib landmarks unavailable.
        
        Args:
            face_region: Cropped face image (grayscale or BGR)
            
        Returns:
            Tuple of (eyes_detected, estimated_ear)
        """
        if len(face_region.shape) == 3:
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_region
        
        # Detect eyes
        eyes = self.eye_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5,
            minSize=(20, 20)
        )
        
        if len(eyes) >= 2:
            # Sort by x position to get left and right eye
            eyes = sorted(eyes, key=lambda e: e[0])
            
            # Estimate EAR from eye height/width ratio
            total_ear = 0
            for (ex, ey, ew, eh) in eyes[:2]:
                # Simple EAR approximation: height/width ratio
                ear = eh / (ew + 1e-6)
                total_ear += ear
            
            avg_ear = total_ear / 2
            return True, avg_ear
        
        return False, 0.0
    
    def is_blinking(self, ear: float, threshold: float = 0.25) -> bool:
        """
        Determine if eyes are blinking based on EAR.
        
        Args:
            ear: Eye Aspect Ratio value
            threshold: EAR threshold for blink detection
            
        Returns:
            True if blinking
        """
        return ear < threshold


class HeadMovementDetector:
    """
    Detect head movements for liveness verification.
    Uses face position tracking over time.
    """
    
    def __init__(
        self,
        movement_threshold: int = 20,
        history_size: int = 10
    ):
        self.movement_threshold = movement_threshold
        self.history_size = history_size
        
        # Face position history
        self.position_history = deque(maxlen=history_size)
        
        # Face cascade for detection
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
    
    def update(self, frame: np.ndarray) -> Optional[Tuple[int, int]]:
        """
        Update with new frame and return face center.
        
        Args:
            frame: Input frame
            
        Returns:
            Face center (x, y) or None if no face detected
        """
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
        
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 5)
        
        if len(faces) > 0:
            # Get largest face
            face_idx = np.argmax([w * h for (x, y, w, h) in faces])
            x, y, w, h = faces[face_idx]
            
            center = (x + w // 2, y + h // 2)
            self.position_history.append(center)
            
            return center
        
        return None
    
    def detect_movement(self, direction: str) -> bool:
        """
        Check if head moved in specified direction.
        
        Args:
            direction: "left", "right", "up", or "down"
            
        Returns:
            True if movement detected in direction
        """
        if len(self.position_history) < 2:
            return False
        
        start_pos = self.position_history[0]
        current_pos = self.position_history[-1]
        
        dx = current_pos[0] - start_pos[0]
        dy = current_pos[1] - start_pos[1]
        
        if direction == "left" and dx < -self.movement_threshold:
            return True
        elif direction == "right" and dx > self.movement_threshold:
            return True
        elif direction == "up" and dy < -self.movement_threshold:
            return True
        elif direction == "down" and dy > self.movement_threshold:
            return True
        
        return False
    
    def reset(self):
        """Reset position history."""
        self.position_history.clear()


class LightIntensityAnalyzer:
    """
    Analyze light intensity changes to detect static images.
    Real faces have natural light intensity variations.
    """
    
    def __init__(
        self,
        change_threshold: float = 5.0,
        history_size: int = 30
    ):
        self.change_threshold = change_threshold
        self.history_size = history_size
        self.intensity_history = deque(maxlen=history_size)
    
    def update(self, face_region: np.ndarray) -> float:
        """
        Update with new face region and return intensity.
        
        Args:
            face_region: Cropped face image
            
        Returns:
            Mean intensity value
        """
        if len(face_region.shape) == 3:
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_region
        
        mean_intensity = np.mean(gray)
        self.intensity_history.append(mean_intensity)
        
        return mean_intensity
    
    def has_natural_variation(self) -> bool:
        """
        Check if intensity has natural variations (not static).
        
        Returns:
            True if natural variations detected
        """
        if len(self.intensity_history) < 10:
            return True  # Not enough data
        
        # Calculate standard deviation of intensity
        std_intensity = np.std(list(self.intensity_history))
        
        # Real faces should have some natural variation
        return std_intensity > self.change_threshold
    
    def reset(self):
        """Reset intensity history."""
        self.intensity_history.clear()


class TextureAnalyzer:
    """
    Analyze face texture to detect printed photos or screens.
    Uses Local Binary Pattern (LBP) variance.
    """
    
    def __init__(self, radius: int = 1, neighbors: int = 8):
        self.radius = radius
        self.neighbors = neighbors
    
    def compute_lbp_variance(self, face_region: np.ndarray) -> float:
        """
        Compute LBP variance for texture analysis.
        
        Args:
            face_region: Cropped face image
            
        Returns:
            LBP variance value
        """
        if len(face_region.shape) == 3:
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_region
        
        # Simple LBP computation
        rows, cols = gray.shape
        lbp = np.zeros((rows - 2, cols - 2), dtype=np.uint8)
        
        for i in range(1, rows - 1):
            for j in range(1, cols - 1):
                center = gray[i, j]
                binary = 0
                
                # 8 neighbors
                neighbors = [
                    gray[i-1, j-1], gray[i-1, j], gray[i-1, j+1],
                    gray[i, j+1], gray[i+1, j+1], gray[i+1, j],
                    gray[i+1, j-1], gray[i, j-1]
                ]
                
                for k, neighbor in enumerate(neighbors):
                    if neighbor >= center:
                        binary |= (1 << k)
                
                lbp[i-1, j-1] = binary
        
        return np.var(lbp)
    
    def is_real_face(self, face_region: np.ndarray, threshold: float = 500) -> bool:
        """
        Check if face has real texture (not printed/screen).
        
        Args:
            face_region: Cropped face image
            threshold: LBP variance threshold
            
        Returns:
            True if texture appears real
        """
        variance = self.compute_lbp_variance(face_region)
        return variance > threshold


class LivenessDetector:
    """
    Main liveness detection class.
    Combines multiple anti-spoofing techniques.
    """
    
    def __init__(
        self,
        ear_threshold: float = 0.25,
        ear_consecutive_frames: int = 3,
        required_blinks: int = 2,
        head_movement_threshold: int = 20,
        intensity_change_threshold: float = 5.0,
        timeout_seconds: float = 10.0
    ):
        """
        Initialize LivenessDetector.
        
        Args:
            ear_threshold: EAR threshold for blink detection
            ear_consecutive_frames: Consecutive frames below threshold for blink
            required_blinks: Number of blinks required for liveness
            head_movement_threshold: Pixel threshold for head movement
            intensity_change_threshold: Threshold for light intensity variation
            timeout_seconds: Maximum time for liveness check
        """
        self.ear_threshold = ear_threshold
        self.ear_consecutive_frames = ear_consecutive_frames
        self.required_blinks = required_blinks
        self.timeout_seconds = timeout_seconds
        
        # Initialize detectors
        self.ear_calculator = EyeAspectRatioCalculator()
        self.head_detector = HeadMovementDetector(
            movement_threshold=head_movement_threshold
        )
        self.intensity_analyzer = LightIntensityAnalyzer(
            change_threshold=intensity_change_threshold
        )
        self.texture_analyzer = TextureAnalyzer()
        
        # State tracking
        self.blink_counter = 0
        self.consecutive_blink_frames = 0
        self.is_currently_blinking = False
        
        self.current_challenge = LivenessChallenge.NONE
        self.challenge_completed = False
        self.start_time = None
        
        # Results
        self.liveness_score = 0.0
        self.checks_passed = {}
    
    def start_session(self, challenge: LivenessChallenge = LivenessChallenge.BLINK):
        """
        Start a new liveness detection session.
        
        Args:
            challenge: Initial challenge type
        """
        self.reset()
        self.current_challenge = challenge
        self.start_time = time.time()
        
        logger.info(f"Liveness session started with challenge: {challenge.value}")
    
    def reset(self):
        """Reset all state for new session."""
        self.blink_counter = 0
        self.consecutive_blink_frames = 0
        self.is_currently_blinking = False
        self.current_challenge = LivenessChallenge.NONE
        self.challenge_completed = False
        self.start_time = None
        self.liveness_score = 0.0
        self.checks_passed = {}
        
        self.head_detector.reset()
        self.intensity_analyzer.reset()
    
    def process_frame(
        self,
        frame: np.ndarray,
        face_location: Optional[Tuple[int, int, int, int]] = None
    ) -> Dict[str, Any]:
        """
        Process a frame for liveness detection.
        
        Args:
            frame: Input frame
            face_location: Optional face bounding box (top, right, bottom, left)
            
        Returns:
            Dictionary with liveness check results
        """
        result = {
            "is_live": False,
            "challenge": self.current_challenge.value,
            "challenge_completed": self.challenge_completed,
            "blinks_detected": self.blink_counter,
            "required_blinks": self.required_blinks,
            "liveness_score": self.liveness_score,
            "message": "",
            "timed_out": False
        }
        
        # Check timeout
        if self.start_time and (time.time() - self.start_time) > self.timeout_seconds:
            result["timed_out"] = True
            result["message"] = "Liveness check timed out"
            return result
        
        # Get face region
        if face_location:
            top, right, bottom, left = face_location
            face_region = frame[top:bottom, left:right]
        else:
            # Detect face
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.ear_calculator.face_cascade.detectMultiScale(gray, 1.1, 5)
            
            if len(faces) == 0:
                result["message"] = "No face detected"
                return result
            
            # Get largest face
            face_idx = np.argmax([w * h for (x, y, w, h) in faces])
            x, y, w, h = faces[face_idx]
            face_region = frame[y:y+h, x:x+w]
            face_location = (y, x + w, y + h, x)
        
        # Process based on current challenge
        if self.current_challenge == LivenessChallenge.BLINK:
            result = self._process_blink_challenge(frame, face_region, result)
        
        elif self.current_challenge in [
            LivenessChallenge.HEAD_LEFT,
            LivenessChallenge.HEAD_RIGHT,
            LivenessChallenge.HEAD_UP,
            LivenessChallenge.HEAD_DOWN
        ]:
            result = self._process_head_challenge(frame, result)
        
        # Always check texture and intensity
        self._check_anti_spoofing(face_region)
        
        # Calculate overall liveness score
        self._calculate_liveness_score()
        result["liveness_score"] = self.liveness_score
        
        return result
    
    def _process_blink_challenge(
        self,
        frame: np.ndarray,
        face_region: np.ndarray,
        result: Dict
    ) -> Dict:
        """Process blink detection challenge."""
        eyes_detected, ear = self.ear_calculator.detect_eyes(face_region)
        
        if not eyes_detected:
            result["message"] = "Eyes not detected - face the camera"
            return result
        
        # Check for blink
        if ear < self.ear_threshold:
            self.consecutive_blink_frames += 1
            
            if self.consecutive_blink_frames >= self.ear_consecutive_frames:
                if not self.is_currently_blinking:
                    self.is_currently_blinking = True
                    self.blink_counter += 1
                    logger.info(f"Blink detected! Count: {self.blink_counter}")
        else:
            self.consecutive_blink_frames = 0
            self.is_currently_blinking = False
        
        result["blinks_detected"] = self.blink_counter
        
        if self.blink_counter >= self.required_blinks:
            self.challenge_completed = True
            self.checks_passed["blink"] = True
            result["challenge_completed"] = True
            result["is_live"] = True
            result["message"] = "Blink challenge completed!"
        else:
            remaining = self.required_blinks - self.blink_counter
            result["message"] = f"Please blink {remaining} more time(s)"
        
        return result
    
    def _process_head_challenge(self, frame: np.ndarray, result: Dict) -> Dict:
        """Process head movement challenge."""
        center = self.head_detector.update(frame)
        
        if center is None:
            result["message"] = "No face detected"
            return result
        
        direction_map = {
            LivenessChallenge.HEAD_LEFT: "left",
            LivenessChallenge.HEAD_RIGHT: "right",
            LivenessChallenge.HEAD_UP: "up",
            LivenessChallenge.HEAD_DOWN: "down"
        }
        
        direction = direction_map.get(self.current_challenge)
        
        if self.head_detector.detect_movement(direction):
            self.challenge_completed = True
            self.checks_passed[f"head_{direction}"] = True
            result["challenge_completed"] = True
            result["is_live"] = True
            result["message"] = f"Head movement ({direction}) detected!"
        else:
            result["message"] = f"Please turn your head {direction}"
        
        return result
    
    def _check_anti_spoofing(self, face_region: np.ndarray):
        """Run additional anti-spoofing checks."""
        # Update intensity analyzer
        self.intensity_analyzer.update(face_region)
        
        # Check texture
        if self.texture_analyzer.is_real_face(face_region):
            self.checks_passed["texture"] = True
        
        # Check intensity variation
        if self.intensity_analyzer.has_natural_variation():
            self.checks_passed["intensity_variation"] = True
    
    def _calculate_liveness_score(self):
        """Calculate overall liveness score from all checks."""
        total_checks = 4  # blink, texture, intensity, challenge
        passed_checks = sum([
            self.checks_passed.get("blink", False),
            self.checks_passed.get("texture", False),
            self.checks_passed.get("intensity_variation", False),
            self.challenge_completed
        ])
        
        self.liveness_score = (passed_checks / total_checks) * 100
    
    def get_challenge_instruction(self) -> str:
        """Get instruction text for current challenge."""
        instructions = {
            LivenessChallenge.BLINK: f"Please blink {self.required_blinks} times",
            LivenessChallenge.HEAD_LEFT: "Please turn your head to the LEFT",
            LivenessChallenge.HEAD_RIGHT: "Please turn your head to the RIGHT",
            LivenessChallenge.HEAD_UP: "Please tilt your head UP",
            LivenessChallenge.HEAD_DOWN: "Please tilt your head DOWN",
            LivenessChallenge.NONE: "No active challenge"
        }
        return instructions.get(self.current_challenge, "Unknown challenge")
    
    def is_session_complete(self) -> bool:
        """Check if liveness session is complete."""
        return self.challenge_completed and self.liveness_score >= 75.0


class LivenessSessionManager:
    """
    Manage multiple liveness challenges in a session.
    """
    
    def __init__(
        self,
        challenges: List[LivenessChallenge] = None,
        timeout_per_challenge: float = 10.0
    ):
        if challenges is None:
            challenges = [LivenessChallenge.BLINK]
        
        self.challenges = challenges
        self.timeout_per_challenge = timeout_per_challenge
        self.current_challenge_idx = 0
        
        self.detector = LivenessDetector(
            timeout_seconds=timeout_per_challenge
        )
        
        self.completed_challenges = []
        self.session_active = False
    
    def start_session(self):
        """Start new liveness session."""
        self.current_challenge_idx = 0
        self.completed_challenges = []
        self.session_active = True
        
        if self.challenges:
            self.detector.start_session(self.challenges[0])
    
    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """Process frame and manage challenge progression."""
        if not self.session_active:
            return {"error": "No active session"}
        
        result = self.detector.process_frame(frame)
        
        # Check if current challenge completed or timed out
        if result.get("challenge_completed") or result.get("timed_out"):
            if result.get("challenge_completed"):
                self.completed_challenges.append(self.challenges[self.current_challenge_idx])
            
            # Move to next challenge
            self.current_challenge_idx += 1
            
            if self.current_challenge_idx < len(self.challenges):
                self.detector.start_session(self.challenges[self.current_challenge_idx])
                result["next_challenge"] = self.challenges[self.current_challenge_idx].value
            else:
                self.session_active = False
                result["session_complete"] = True
                result["passed"] = len(self.completed_challenges) == len(self.challenges)
        
        result["progress"] = {
            "current": self.current_challenge_idx + 1,
            "total": len(self.challenges),
            "completed": len(self.completed_challenges)
        }
        
        return result
    
    def is_verified(self) -> bool:
        """Check if user passed all challenges."""
        return len(self.completed_challenges) == len(self.challenges)
