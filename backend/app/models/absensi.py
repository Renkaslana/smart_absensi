"""
Absensi model for attendance records.
"""

from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Absensi(Base):
    __tablename__ = "absensi"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="hadir", index=True)  # hadir, terlambat, izin, sakit
    confidence = Column(Float, nullable=True)  # Face recognition confidence
    image_path = Column(String(255), nullable=True)  # Snapshot at attendance
    device_info = Column(String(500), nullable=True)  # Browser/device info
    ip_address = Column(String(45), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="absensi_records")
    
    # Unique constraint: one attendance per user per day
    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uix_user_date'),
    )
    
    def __repr__(self):
        return f"<Absensi(id={self.id}, user_id={self.user_id}, date={self.date}, status={self.status})>"
