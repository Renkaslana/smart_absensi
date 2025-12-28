"""
Core configuration settings for the application.
Uses pydantic-settings for environment variable management.
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Smart Absensi API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = Field(..., min_length=32)
    
    # Database
    DATABASE_URL: str = "sqlite:///./database/absensi.db"
    DB_ECHO: bool = False
    
    # JWT
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # Next.js development server
        "http://127.0.0.1:3001"
    ]
    
    # File Storage
    FACE_STORAGE_PATH: str = "./database/wajah_siswa"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/jpg"]
    
    # Face Recognition
    FACE_DETECTION_MODEL: str = "hog"  # hog or cnn
    FACE_RECOGNITION_TOLERANCE: float = 0.6
    FACE_MIN_CONFIDENCE: float = 0.8
    MIN_FACE_IMAGES: int = 3
    
    # Liveness Detection
    LIVENESS_ENABLED: bool = True
    LIVENESS_BLINK_THRESHOLD: float = 0.25
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    MAX_REQUEST_SIZE_MB: int = 20
    
    # Email (Optional)
    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@absensi.ac.id"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
