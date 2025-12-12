# Routes Module - Enhanced for Academic System
from .auth import router as auth_router, get_current_user, get_admin_user
from .face import router as face_router
from .absensi import router as absensi_router
from .admin import router as admin_router
from .public import router as public_router

__all__ = [
    "auth_router",
    "face_router",
    "absensi_router",
    "admin_router",
    "public_router",
    "get_current_user",
    "get_admin_user"
]
