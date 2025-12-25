"""
Authentication routes.
Handles user registration, login, logout, token refresh, and password management.
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    ChangePasswordRequest
)
from app.schemas.user import UserResponse
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.exceptions import UnauthorizedException, BadRequestException, ConflictException
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    
    - **nim**: Nomor Induk Mahasiswa (unique)
    - **name**: Full name
    - **password**: Password (min 8 characters)
    - **email**: Optional email address
    """
    # Check if NIM already exists
    existing_user = db.query(User).filter(User.nim == request.nim).first()
    if existing_user:
        raise ConflictException(f"NIM {request.nim} already registered")
    
    # Check if email already exists (if provided)
    if request.email:
        existing_email = db.query(User).filter(User.email == request.email).first()
        if existing_email:
            raise ConflictException(f"Email {request.email} already registered")
    
    # Create new user
    new_user = User(
        nim=request.nim,
        name=request.name,
        email=request.email,
        password_hash=get_password_hash(request.password),
        role="user",
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create tokens
    access_token = create_access_token(data={"sub": new_user.id, "role": new_user.role})
    refresh_token_str = create_refresh_token(data={"sub": new_user.id})
    
    # Save refresh token to database
    refresh_token = RefreshToken(
        user_id=new_user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(refresh_token)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with NIM and password.
    
    Returns access token and refresh token.
    """
    # Find user by NIM
    user = db.query(User).filter(User.nim == request.nim).first()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise UnauthorizedException("Incorrect NIM or password")
    
    if not user.is_active:
        raise UnauthorizedException("Account is inactive")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    refresh_token_str = create_refresh_token(data={"sub": user.id})
    
    # Save refresh token to database
    refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(refresh_token)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token.
    """
    # Decode refresh token
    payload = decode_token(request.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")
    
    # Check if refresh token exists and is valid
    refresh_token_db = db.query(RefreshToken).filter(
        RefreshToken.token == request.refresh_token,
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not refresh_token_db:
        raise UnauthorizedException("Refresh token is invalid or expired")
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")
    
    # Create new access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    # Optionally create new refresh token (refresh token rotation)
    new_refresh_token = create_refresh_token(data={"sub": user.id})
    
    # Revoke old refresh token
    refresh_token_db.revoked = True
    
    # Save new refresh token
    new_refresh_token_db = RefreshToken(
        user_id=user.id,
        token=new_refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(new_refresh_token_db)
    db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user by revoking all refresh tokens.
    """
    # Revoke all user's refresh tokens
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False
    ).update({"revoked": True})
    
    db.commit()
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    """
    return UserResponse.model_validate(current_user)


@router.put("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change user password.
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise BadRequestException("Current password is incorrect")
    
    # Update password
    current_user.password_hash = get_password_hash(request.new_password)
    db.commit()
    
    # Revoke all refresh tokens for security
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False
    ).update({"revoked": True})
    db.commit()
    
    return {"message": "Password changed successfully. Please login again."}
