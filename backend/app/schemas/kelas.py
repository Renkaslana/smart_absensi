"""
Kelas schemas untuk request dan response.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class KelasBase(BaseModel):
    code: str = Field(..., description="Kode kelas (unique)", example="PCD-A")
    name: str = Field(..., description="Nama lengkap kelas", example="Pemrosesan Citra Digital - A")
    description: Optional[str] = Field(None, description="Deskripsi kelas")
    capacity: int = Field(40, description="Kapasitas maksimal", ge=1, le=100)
    academic_year: Optional[str] = Field(None, description="Tahun ajaran", example="2024/2025")
    semester: Optional[int] = Field(None, description="Semester", ge=1, le=8)
    is_active: bool = Field(True, description="Status aktif")


class KelasCreate(KelasBase):
    """Schema untuk membuat kelas baru."""
    pass


class KelasUpdate(BaseModel):
    """Schema untuk update kelas (semua field optional)."""
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1, le=100)
    academic_year: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=8)
    is_active: Optional[bool] = None


class KelasResponse(KelasBase):
    """Schema untuk response kelas."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class KelasWithStats(KelasResponse):
    """Schema kelas dengan statistik."""
    total_students: int = Field(0, description="Jumlah siswa di kelas ini")
    students_with_face: int = Field(0, description="Siswa yang sudah daftar wajah")
    attendance_rate: float = Field(0.0, description="Rata-rata kehadiran kelas (%)")

    model_config = {"from_attributes": True}
