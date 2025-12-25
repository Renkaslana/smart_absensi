"""
Face recognition related schemas.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class FaceScanRequest(BaseModel):
    """Schema for face scanning request."""
    image_base64: str = Field(..., description="Base64 encoded image")
    
    class Config:
        json_schema_extra = {
            "example": {
                "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            }
        }


class FaceScanResponse(BaseModel):
    """Response for face scanning."""
    recognized: bool
    user_id: Optional[int] = None
    nim: Optional[str] = None
    name: Optional[str] = None
    kelas: Optional[str] = None
    confidence: float = 0.0
    message: Optional[str] = None


class FaceRegisterRequest(BaseModel):
    """Schema for face registration request."""
    images_base64: List[str] = Field(
        ..., 
        min_length=3, 
        max_length=5,
        description="List of base64 encoded images (minimum 3, maximum 5)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "images_base64": [
                    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                ]
            }
        }


class FaceRegisterResponse(BaseModel):
    """Response for face registration."""
    success: bool = True
    message: str
    encodings_count: int


class FaceStatusResponse(BaseModel):
    """Response for face registration status."""
    has_face: bool
    encodings_count: int
