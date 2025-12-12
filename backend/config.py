# =============================================================================
# KONFIGURASI SISTEM ABSENSI WAJAH
# =============================================================================
# File ini berisi semua konfigurasi untuk sistem absensi

import os
from pathlib import Path
from datetime import timedelta

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/smart_absensi")

# =============================================================================
# JWT CONFIGURATION  
# =============================================================================
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key-change-in-production-2024")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

# =============================================================================
# FILE PATHS
# =============================================================================
DATASET_DIR = BASE_DIR / "dataset_wajah"
ENCODINGS_DIR = BASE_DIR / "encodings"
OUTPUT_DIR = BASE_DIR / "output"
UPLOAD_DIR = BASE_DIR / "uploads"

# Ensure directories exist
for dir_path in [DATASET_DIR, ENCODINGS_DIR, OUTPUT_DIR, UPLOAD_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# =============================================================================
# FACE RECOGNITION CONFIGURATION
# =============================================================================
class FaceRecognitionConfig:
    # Preprocessing
    CLAHE_CLIP_LIMIT = 2.0
    CLAHE_TILE_GRID_SIZE = (8, 8)
    
    # Face Detection
    HOG_SCALE_FACTOR = 1.1
    HOG_MIN_NEIGHBORS = 5
    HOG_MIN_SIZE = (30, 30)
    
    # Face Encoding
    ENCODING_MODEL = "lbph"  # Options: "lbph", "histogram", "flatten"
    LBPH_RADIUS = 1
    LBPH_NEIGHBORS = 8
    LBPH_GRID_X = 8
    LBPH_GRID_Y = 8
    
    # Face Recognition Thresholds
    RECOGNITION_TOLERANCE = 0.6
    RECOGNITION_DISTANCE_THRESHOLD = 100  # For LBPH
    MIN_CONFIDENCE = 60.0  # Minimum confidence percentage
    
    # Registration
    MIN_PHOTOS_PER_PERSON = 3
    MAX_PHOTOS_PER_PERSON = 10
    
    # Performance
    FRAME_RESIZE_FACTOR = 0.25
    PROCESS_EVERY_N_FRAMES = 3
    MAX_FACES_PER_FRAME = 3

# =============================================================================
# LIVENESS DETECTION CONFIGURATION
# =============================================================================
class LivenessConfig:
    # Eye Aspect Ratio (EAR) for blink detection
    EAR_THRESHOLD = 0.25
    EAR_CONSECUTIVE_FRAMES = 3
    REQUIRED_BLINKS = 2
    
    # Head Movement Detection
    HEAD_MOVEMENT_THRESHOLD = 20  # pixels
    HEAD_MOVEMENT_DIRECTIONS = ["left", "right"]
    
    # Light Intensity Change Detection
    INTENSITY_CHANGE_THRESHOLD = 30
    
    # Timing
    LIVENESS_CHECK_TIMEOUT = 10  # seconds
    CHALLENGE_INTERVAL = 3  # seconds between challenges

# =============================================================================
# RATE LIMITING CONFIGURATION
# =============================================================================
class RateLimitConfig:
    # General API limits
    REQUESTS_PER_MINUTE = 60
    REQUESTS_PER_HOUR = 1000
    
    # Authentication limits
    LOGIN_ATTEMPTS_PER_MINUTE = 5
    REGISTER_ATTEMPTS_PER_HOUR = 10
    
    # Absensi limits
    ABSENSI_PER_USER_PER_DAY = 10  # Max check-ins per user per day

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]

# =============================================================================
# UPLOAD CONFIGURATION
# =============================================================================
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
