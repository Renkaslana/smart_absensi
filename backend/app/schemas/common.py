"""
Common schemas used across the application.
"""

from typing import Optional, Generic, TypeVar, List
from pydantic import BaseModel
from datetime import datetime

T = TypeVar("T")


class ResponseBase(BaseModel):
    """Base response model."""
    success: bool = True
    message: str
    data: Optional[dict] = None


class PaginationParams(BaseModel):
    """Pagination parameters."""
    limit: int = 10
    offset: int = 0
    
    class Config:
        json_schema_extra = {
            "example": {
                "limit": 10,
                "offset": 0
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ChangePasswordRequest(BaseModel):
    """Password change request."""
    current_password: str
    new_password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "oldpassword123",
                "new_password": "newpassword456"
            }
        }
