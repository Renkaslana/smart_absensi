"""
FastAPI main application.
Smart Absensi - Face Recognition Attendance System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Import routes
from app.api.v1 import auth, face, absensi, admin, public, kelas
from app.api.v1.endpoints import students, teachers, public_attendance, settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    print("="*60)
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print("="*60)
    
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ready")
    
    # Import dependencies
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    import os
    
    db = SessionLocal()
    try:
        # === AUTO CREATE ADMIN USER ===
        # Check if admin user exists, if not create one
        admin = db.query(User).filter(User.nim == "admin").first()
        if not admin:
            print("📦 Creating default admin user...")
            admin = User(
                nim="admin",
                name="Administrator",
                email="admin@absensi.ac.id",
                password_hash=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("✅ Admin user created!")
            print("   NIM: admin")
            print("   Password: admin123")
            print("   ⚠️  Please change the password after first login!")
        else:
            print("✅ Admin user exists")
        
        # === SYNC FACE STATUS ===
        face_storage_path = settings.FACE_STORAGE_PATH
        if os.path.exists(face_storage_path):
            # Get all user folders (NIM folders)
            user_folders = [f for f in os.listdir(face_storage_path) 
                          if os.path.isdir(os.path.join(face_storage_path, f))]
            
            # Update has_face for users with existing folders
            for nim_folder in user_folders:
                folder_path = os.path.join(face_storage_path, nim_folder)
                # Check if folder has at least 3 images
                images = [f for f in os.listdir(folder_path) 
                         if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                
                if len(images) >= 3:
                    # Update user has_face = True
                    user = db.query(User).filter(User.nim == nim_folder).first()
                    if user and not user.has_face:
                        user.has_face = True
                        print(f"  ✓ Synced has_face for {nim_folder} ({len(images)} images)")
            
            db.commit()
            print(f"✅ Face registration status synced from {len(user_folders)} folders")
    except Exception as e:
        print(f"⚠️ Error syncing face status: {e}")
        db.rollback()
    finally:
        db.close()
    
    yield
    
    # Shutdown
    print("="*60)
    print(f"👋 Shutting down {settings.APP_NAME}")
    print("="*60)


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Smart Absensi - Face Recognition based Attendance System",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# CORS Middleware - Must be added BEFORE any routes
# Allow specific origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3001", 
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3001",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
)



# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX
    }


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Include routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_PREFIX}/auth",
    tags=["Authentication"]
)

app.include_router(
    face.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    absensi.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    admin.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    public.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    kelas.router,
    prefix=settings.API_V1_PREFIX
)

app.include_router(
    students.router,
    prefix=f"{settings.API_V1_PREFIX}/students",
    tags=["Students"]
)

app.include_router(
    teachers.router,
    prefix=f"{settings.API_V1_PREFIX}/teachers",
    tags=["Teachers"]
)

app.include_router(
    public_attendance.router,
    prefix=f"{settings.API_V1_PREFIX}/public",
    tags=["Public Attendance"]
)

app.include_router(
    settings_router.router,
    prefix=f"{settings.API_V1_PREFIX}/settings",
    tags=["Settings"]
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG
    )
