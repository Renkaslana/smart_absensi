# =============================================================================
# AUTHENTICATION ROUTES
# =============================================================================

from fastapi import APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
import logging

from ..database import (
    create_user,
    get_user_by_nim,
    get_user_by_id,
    update_user
)
from ..utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_access_token,
    verify_refresh_token,
    sanitize_nim,
    sanitize_name,
    validate_password_strength,
    rate_limiter
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class RegisterRequest(BaseModel):
    nim: str = Field(..., min_length=5, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    email: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "nim": "23215030",
                "name": "John Doe",
                "password": "SecurePass123",
                "email": "john@university.edu"
            }
        }


class LoginRequest(BaseModel):
    nim: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "nim": "23215030",
                "password": "SecurePass123"
            }
        }


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


# =============================================================================
# DEPENDENCY - Get Current User
# =============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Dependency to get current authenticated user from JWT token.
    """
    token = credentials.credentials
    payload = verify_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    user_id = payload.get("user_id")
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


async def get_admin_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Dependency to verify admin role.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


# =============================================================================
# ROUTES
# =============================================================================

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: Request, data: RegisterRequest):
    """
    Register a new user account.
    """
    # Rate limiting
    client_ip = request.client.host
    if rate_limiter.is_rate_limited(client_ip, limit=10, window_seconds=3600):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later."
        )
    
    # Sanitize inputs
    nim = sanitize_nim(data.nim)
    name = sanitize_name(data.name)
    
    if not nim or not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid NIM or name format"
        )
    
    # Validate password strength
    password_check = validate_password_strength(data.password)
    if not password_check["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Password does not meet requirements",
                "errors": password_check["errors"]
            }
        )
    
    # Check if user exists
    existing = get_user_by_nim(nim)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this NIM already exists"
        )
    
    # Create user
    password_hash = hash_password(data.password)
    user = create_user(
        nim=nim,
        name=name,
        password_hash=password_hash,
        email=data.email,
        role="mahasiswa"
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Generate tokens
    token_data = {"user_id": user["id"], "nim": user["nim"], "role": user["role"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    logger.info(f"New user registered: {nim}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: Request, data: LoginRequest):
    """
    Login with NIM and password.
    """
    # Rate limiting
    client_ip = request.client.host
    if rate_limiter.is_rate_limited(client_ip, limit=5, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait a minute."
        )
    
    # Sanitize
    nim = sanitize_nim(data.nim)
    
    # Get user
    user = get_user_by_nim(nim)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid NIM or password"
        )
    
    # Verify password
    if not verify_password(data.password, user["password"]):
        logger.warning(f"Failed login attempt for NIM: {nim}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid NIM or password"
        )
    
    # Generate tokens
    token_data = {"user_id": user["id"], "nim": user["nim"], "role": user["role"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Remove password from response
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    logger.info(f"User logged in: {nim}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshRequest):
    """
    Refresh access token using refresh token.
    """
    payload = verify_refresh_token(data.refresh_token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    user_id = payload.get("user_id")
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Generate new tokens
    token_data = {"user_id": user["id"], "nim": user["nim"], "role": user["role"]}
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=user_response
    )


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current user information.
    """
    return {k: v for k, v in current_user.items() if k != "password"}


@router.put("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Change password for current user.
    """
    # Verify current password
    if not verify_password(data.current_password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    password_check = validate_password_strength(data.new_password)
    if not password_check["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "New password does not meet requirements",
                "errors": password_check["errors"]
            }
        )
    
    # Update password
    new_hash = hash_password(data.new_password)
    update_user(current_user["id"], password=new_hash)
    
    logger.info(f"Password changed for user: {current_user['nim']}")
    
    return {"message": "Password changed successfully"}


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout current user.
    Note: JWT tokens are stateless, so logout is handled client-side.
    """
    logger.info(f"User logged out: {current_user['nim']}")
    return {"message": "Logged out successfully"}
