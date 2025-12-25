"""
Authentication-related schemas.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """Login request schema."""
    nim: str = Field(..., description="NIM (Nomor Induk Mahasiswa)")
    password: str = Field(..., min_length=8)
    
    class Config:
        json_schema_extra = {
            "example": {
                "nim": "23215008",
                "password": "password123"
            }
        }


class RegisterRequest(BaseModel):
    """Registration request schema."""
    nim: str = Field(..., min_length=3, max_length=20)
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    email: Optional[EmailStr] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "nim": "23215008",
                "name": "John Doe",
                "password": "password123",
                "email": "john@example.com"
            }
        }


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class ChangePasswordRequest(BaseModel):
    """Change password request schema."""
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)
