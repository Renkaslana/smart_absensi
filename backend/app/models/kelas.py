"""
Kelas model untuk manajemen kelas sekolah.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db.base import Base


class Kelas(Base):
    """
    Model untuk kelas di sekolah.
    Contoh: PCD-A, RPL-B, TI-1, dll.
    """
    __tablename__ = "kelas"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)  # Kode kelas: PCD-A
    name = Column(String(100), nullable=False)  # Nama lengkap: Pemrosesan Citra Digital - A
    description = Column(Text, nullable=True)  # Deskripsi kelas
    capacity = Column(Integer, default=40)  # Kapasitas maksimal siswa
    is_active = Column(Boolean, default=True)  # Status aktif/tidak
    academic_year = Column(String(20), nullable=True)  # Tahun ajaran: 2024/2025
    semester = Column(Integer, nullable=True)  # Semester: 1-8
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Kelas {self.code}: {self.name}>"
