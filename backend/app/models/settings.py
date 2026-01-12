"""
Settings Model - Global application settings
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.session import Base


class Settings(Base):
    """Settings model for storing application-wide configurations"""
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False, comment="Setting key (e.g., 'attendance_late_threshold')")
    value = Column(Text, nullable=False, comment="Setting value (JSON string for complex values)")
    description = Column(Text, comment="Human-readable description of this setting")
    category = Column(String(50), index=True, comment="Category (e.g., 'attendance', 'system', 'notification')")
    is_editable = Column(Boolean, default=True, comment="Can this setting be edited by admin?")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Settings {self.key}={self.value}>"
