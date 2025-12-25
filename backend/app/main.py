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
from app.api.v1 import auth, face, absensi, admin, public


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

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
