"""
FaceEncoding model for storing face recognition data.
"""

from sqlalchemy import Column, Integer, String, Float, LargeBinary, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class FaceEncoding(Base):
    __tablename__ = "face_encodings"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    encoding_data = Column(LargeBinary, nullable=False)  # Pickled numpy array
    image_path = Column(String(255), nullable=True)  # Path to original image
    confidence = Column(Float, nullable=True)  # Quality score of the encoding
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="face_encodings")
    
    def __repr__(self):
        return f"<FaceEncoding(id={self.id}, user_id={self.user_id})>"
