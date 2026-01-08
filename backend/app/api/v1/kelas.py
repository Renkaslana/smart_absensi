"""
Kelas API Routes - Manajemen Kelas Sekolah
Endpoints for class management (create, read, update, delete).
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List

from app.api.deps import get_current_admin, get_db
from app.models.kelas import Kelas
from app.models.user import User
from app.schemas.kelas import KelasCreate, KelasUpdate, KelasResponse, KelasWithStats
from app.schemas.common import ResponseBase, PaginatedResponse

router = APIRouter(prefix="/admin/classrooms", tags=["Kelas Management"])


@router.get("", response_model=PaginatedResponse[KelasWithStats])
async def get_all_kelas(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all kelas with statistics.
    Supports search by code/name and filter by active status.
    """
    query = db.query(Kelas)
    
    # Filter by search
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Kelas.code.ilike(search_term)) | 
            (Kelas.name.ilike(search_term))
        )
    
    # Filter by active status
    if is_active is not None:
        query = query.filter(Kelas.is_active == is_active)
    
    # Order by code
    query = query.order_by(Kelas.code)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    kelas_list = query.offset(skip).limit(limit).all()
    
    # Build response with statistics
    items = []
    for kelas in kelas_list:
        # Count students in this class
        total_students = db.query(User).filter(
            User.kelas == kelas.code,
            User.role == "user"
        ).count()
        
        # Count students with face
        students_with_face = db.query(User).filter(
            User.kelas == kelas.code,
            User.role == "user",
            User.has_face == True
        ).count()
        
        # Calculate attendance rate (simplified - could be more complex)
        attendance_rate = 0.0
        if total_students > 0:
            attendance_rate = round((students_with_face / total_students) * 100, 1)
        
        items.append(KelasWithStats(
            id=kelas.id,
            code=kelas.code,
            name=kelas.name,
            description=kelas.description,
            capacity=kelas.capacity,
            academic_year=kelas.academic_year,
            semester=kelas.semester,
            is_active=kelas.is_active,
            created_at=kelas.created_at,
            updated_at=kelas.updated_at,
            total_students=total_students,
            students_with_face=students_with_face,
            attendance_rate=attendance_rate
        ))
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit
    )


@router.get("/{kelas_id}", response_model=KelasWithStats)
async def get_kelas_detail(
    kelas_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific kelas."""
    kelas = db.query(Kelas).filter(Kelas.id == kelas_id).first()
    if not kelas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Kelas not found"
        )
    
    # Get statistics
    total_students = db.query(User).filter(
        User.kelas == kelas.code,
        User.role == "user"
    ).count()
    
    students_with_face = db.query(User).filter(
        User.kelas == kelas.code,
        User.role == "user",
        User.has_face == True
    ).count()
    
    attendance_rate = 0.0
    if total_students > 0:
        attendance_rate = round((students_with_face / total_students) * 100, 1)
    
    return KelasWithStats(
        id=kelas.id,
        code=kelas.code,
        name=kelas.name,
        description=kelas.description,
        capacity=kelas.capacity,
        academic_year=kelas.academic_year,
        semester=kelas.semester,
        is_active=kelas.is_active,
        created_at=kelas.created_at,
        updated_at=kelas.updated_at,
        total_students=total_students,
        students_with_face=students_with_face,
        attendance_rate=attendance_rate
    )


@router.post("", response_model=KelasResponse)
async def create_kelas(
    kelas_data: KelasCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new kelas."""
    # Check if code already exists
    existing = db.query(Kelas).filter(Kelas.code == kelas_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Kelas with code '{kelas_data.code}' already exists"
        )
    
    # Create kelas
    kelas = Kelas(
        code=kelas_data.code,
        name=kelas_data.name,
        description=kelas_data.description,
        capacity=kelas_data.capacity,
        academic_year=kelas_data.academic_year,
        semester=kelas_data.semester,
        is_active=kelas_data.is_active
    )
    
    db.add(kelas)
    db.commit()
    db.refresh(kelas)
    
    return KelasResponse.model_validate(kelas)


@router.put("/{kelas_id}", response_model=KelasResponse)
async def update_kelas(
    kelas_id: int,
    kelas_data: KelasUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update kelas information."""
    kelas = db.query(Kelas).filter(Kelas.id == kelas_id).first()
    if not kelas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kelas not found"
        )
    
    # Check code uniqueness if being changed
    if kelas_data.code and kelas_data.code != kelas.code:
        existing = db.query(Kelas).filter(
            Kelas.code == kelas_data.code,
            Kelas.id != kelas_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Kelas code '{kelas_data.code}' already used"
            )
        kelas.code = kelas_data.code
    
    # Update fields
    if kelas_data.name:
        kelas.name = kelas_data.name
    if kelas_data.description is not None:
        kelas.description = kelas_data.description
    if kelas_data.capacity:
        kelas.capacity = kelas_data.capacity
    if kelas_data.academic_year is not None:
        kelas.academic_year = kelas_data.academic_year
    if kelas_data.semester is not None:
        kelas.semester = kelas_data.semester
    if kelas_data.is_active is not None:
        kelas.is_active = kelas_data.is_active
    
    db.commit()
    db.refresh(kelas)
    
    return KelasResponse.model_validate(kelas)


@router.delete("/{kelas_id}", response_model=ResponseBase)
async def delete_kelas(
    kelas_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a kelas."""
    kelas = db.query(Kelas).filter(Kelas.id == kelas_id).first()
    if not kelas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kelas not found"
        )
    
    # Check if there are students in this class
    student_count = db.query(User).filter(
        User.kelas == kelas.code,
        User.role == "user"
    ).count()
    
    if student_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete kelas. There are {student_count} students in this class. Please reassign them first."
        )
    
    db.delete(kelas)
    db.commit()
    
    return ResponseBase(
        success=True,
        message=f"Kelas '{kelas.code}' deleted successfully"
    )


@router.get("/options/list", response_model=List[dict])
async def get_kelas_options(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get simple list of kelas for dropdown/select options.
    Only returns active kelas with code and name.
    """
    kelas_list = db.query(Kelas).filter(Kelas.is_active == True).order_by(Kelas.code).all()
    
    return [
        {
            "value": k.code,
            "label": f"{k.code} - {k.name}",
            "id": k.id
        }
        for k in kelas_list
    ]
