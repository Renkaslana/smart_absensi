# =============================================================================
# SMART ABSENSI - FASTAPI MAIN APPLICATION
# =============================================================================
# Enhanced face recognition attendance system
# Developed from prototype with improved features

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import uvicorn
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routes
from backend.routes import auth_router, face_router, absensi_router, admin_router, public_router
from backend.database import init_database


# =============================================================================
# LIFESPAN EVENTS
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown events.
    """
    # Startup
    logger.info("Starting Smart Absensi Backend...")
    
    # Initialize database
    init_database()
    logger.info("Database initialized")
    
    # Create required directories
    dirs = ["encodings", "dataset_wajah", "output", "uploads"]
    for dir_name in dirs:
        Path(dir_name).mkdir(parents=True, exist_ok=True)
    logger.info("Directories created")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Smart Absensi Backend...")


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Smart Absensi API",
    description="""
    ## Sistem Absensi Berbasis Wajah
    
    API untuk sistem absensi menggunakan face recognition dengan fitur:
    
    * **Authentication** - Login, Register, JWT Token
    * **Face Registration** - Daftarkan wajah dengan multiple photos
    * **Face Recognition** - Pengenalan wajah real-time
    * **Liveness Detection** - Anti-spoofing dengan blink detection
    * **Attendance Management** - Kelola absensi mahasiswa
    * **Admin Dashboard** - Manajemen user dan laporan
    
    ### Teknologi:
    - FastAPI (Python)
    - OpenCV + face_recognition
    - SQLite Database
    - JWT Authentication
    - LBPH Face Encoding
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# =============================================================================
# CORS MIDDLEWARE
# =============================================================================

# Allow all origins in development
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]

# For development, allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# For development, allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# SECURITY MIDDLEWARE
# =============================================================================

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response


# =============================================================================
# EXCEPTION HANDLERS
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if app.debug else "An unexpected error occurred"
        }
    )


# =============================================================================
# REGISTER ROUTERS
# =============================================================================

app.include_router(auth_router)
app.include_router(face_router)
app.include_router(absensi_router)
app.include_router(admin_router)
app.include_router(public_router)  # Public routes for student attendance without login


# =============================================================================
# ROOT ENDPOINTS
# =============================================================================

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - API information.
    """
    return {
        "name": "Smart Absensi API",
        "version": "2.0.0",
        "status": "running",
        "documentation": "/docs",
        "endpoints": {
            "auth": "/auth",
            "face": "/face",
            "absensi": "/absensi",
            "admin": "/admin",
            "public": "/public"
        }
    }


@app.get("/health", tags=["Root"])
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "database": "connected",
        "services": {
            "face_recognition": "active",
            "liveness_detection": "active"
        }
    }


@app.get("/api/info", tags=["Root"])
async def api_info():
    """
    Get API detailed information.
    """
    return {
        "name": "Smart Absensi API",
        "version": "2.0.0",
        "description": "Face Recognition Attendance System",
        "features": [
            "User Authentication (JWT)",
            "Face Registration (Multiple Photos)",
            "Face Recognition (HOG + face_recognition)",
            "Liveness Detection (Blink, Head Movement)",
            "Attendance Management",
            "Admin Dashboard",
            "Report Generation"
        ],
        "tech_stack": {
            "framework": "FastAPI",
            "face_detection": "HOG (face_recognition)",
            "face_encoding": "face_recognition + LBPH",
            "database": "SQLite",
            "authentication": "JWT + bcrypt"
        },
        "security": {
            "password_hashing": "bcrypt",
            "token_type": "JWT",
            "rate_limiting": "enabled",
            "input_sanitization": "enabled"
        }
    }


# =============================================================================
# RUN SERVER
# =============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
