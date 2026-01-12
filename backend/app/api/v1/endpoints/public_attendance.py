"""
Public Attendance API Endpoints

Endpoints untuk kiosk attendance tanpa autentikasi.
Digunakan untuk face recognition attendance di kiosk/public terminal.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date
import base64

from app.api.deps import get_db
from app.models.user import User
from app.models.absensi import Absensi
from app.models.kelas import Kelas
from app.models.face_encoding import FaceEncoding
from app.services.face_recognition_service import FaceRecognitionService as FaceService
from app.services.attendance_service import AttendanceService
from app.utils.image_processing import decode_base64_image


router = APIRouter()


@router.post("/attendance/mark")
async def mark_public_attendance(
    image: str = Body(..., description="Base64 encoded image"),
    location: Optional[str] = Body(None, description="Kiosk location"),
    kelas_id: Optional[int] = Body(None, description="Class ID if specific class"),
    db: Session = Depends(get_db)
):
    """
    **Mark attendance via kiosk face recognition**
    
    Public endpoint untuk attendance marking tanpa login.
    Digunakan di kiosk/terminal umum dengan face recognition.
    
    **Request Body:**
    - `image`: Base64 encoded image (required)
    - `location`: Kiosk location/identifier (optional)
    - `kelas_id`: Specific class ID (optional)
    
    **Response:**
    - `success`: Boolean status
    - `student`: Student information (name, nim, kelas)
    - `attendance`: Attendance details (tanggal, waktu, status)
    - `confidence`: Face recognition confidence score
    - `message`: Success/error message
    
    **Process:**
    1. Decode base64 image
    2. Recognize face using FaceRecognitionService
    3. Verify student exists and registered
    4. Check if already marked today
    5. Create attendance record
    6. Return success with student info
    """
    try:
        # Decode base64 image
        if "," in image:
            # Remove data:image/jpeg;base64, prefix if exists
            image = image.split(",")[1]
        
        print(f"[PublicAttendance] Image data length: {len(image)}")
        image_data = base64.b64decode(image)
        print(f"[PublicAttendance] Decoded image size: {len(image_data)} bytes")
        
        # Decode image to PIL
        pil_image = decode_base64_image(image)
        print(f"[PublicAttendance] PIL Image size: {pil_image.size}")
        
        # Initialize face service
        face_service = FaceService()
        
        # Load face encodings from database
        print(f"[PublicAttendance] Loading face encodings from database...")
        face_encodings_db = db.query(FaceEncoding).all()
        print(f"[PublicAttendance] Found {len(face_encodings_db)} face encodings")
        
        if not face_encodings_db:
            raise HTTPException(
                status_code=404,
                detail="No registered faces in database"
            )
        
        # Deserialize encodings
        import pickle
        known_encodings = []
        user_ids = []
        
        for fe in face_encodings_db:
            try:
                encoding = pickle.loads(fe.encoding_data)
                known_encodings.append(encoding)
                user_ids.append(fe.user_id)
            except Exception as e:
                print(f"[PublicAttendance] Error deserializing encoding for user {fe.user_id}: {e}")
                continue
        
        print(f"[PublicAttendance] Loaded {len(known_encodings)} valid encodings")
        
        # Recognize face
        print(f"[PublicAttendance] Starting face recognition...")
        result = face_service.recognize_face(pil_image, known_encodings, user_ids)
        print(f"[PublicAttendance] Face recognition result: {result}")
        
        if result is None:
            raise HTTPException(
                status_code=404,
                detail="Face not recognized. Please ensure you are registered."
            )
        
        user_id = result["user_id"]
        confidence = result["confidence"]
        
        # Get user info
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if student has registered face
        if not user.has_face:
            raise HTTPException(
                status_code=400,
                detail="Face registration incomplete. Please register your face first."
            )
        
        # Get today's date
        today = date.today()
        
        # Check if already marked today
        existing = db.query(Absensi).filter(
            Absensi.user_id == user_id,
            Absensi.date == today
        ).first()
        
        if existing:
            waktu_absen = existing.timestamp.strftime("%H:%M:%S") if existing.timestamp else ""
            return {
                "success": True,  # Changed to True for better UX
                "already_submitted": True,  # Flag untuk duplikasi
                "message": f"{user.name}, Anda sudah melakukan absensi hari ini pada pukul {waktu_absen}",
                "student": {
                    "id": user.id,
                    "name": user.name,
                    "nim": user.nim,
                    "kelas": user.kelas
                },
                "attendance": {
                    "id": existing.id,
                    "tanggal": str(existing.date),
                    "waktu": waktu_absen,
                    "status": existing.status,
                    "method": "face_recognition",
                    "confidence": existing.confidence
                },
                "confidence": confidence
            }
        
        # Create attendance record
        now = datetime.now()
        
        new_attendance = Absensi(
            user_id=user_id,
            date=today,
            timestamp=now,
            status="hadir",
            confidence=confidence,
            device_info=f"Kiosk attendance - {location}" if location else "Kiosk attendance"
        )
        
        db.add(new_attendance)
        db.commit()
        db.refresh(new_attendance)
        
        waktu_absen = new_attendance.timestamp.strftime("%H:%M:%S") if new_attendance.timestamp else ""
        return {
            "success": True,
            "already_submitted": False,  # Flag untuk absensi baru
            "message": f"Selamat datang, {user.name}! Absensi berhasil dicatat pada pukul {waktu_absen}",
            "student": {
                "id": user.id,
                "name": user.name,
                "nim": user.nim,
                "kelas": user.kelas
            },
            "attendance": {
                "id": new_attendance.id,
                "tanggal": str(new_attendance.date),
                "waktu": waktu_absen,
                "status": new_attendance.status,
                "method": "face_recognition",
                "confidence": new_attendance.confidence
            },
            "confidence": confidence
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking attendance: {str(e)}")


@router.get("/kiosk/info")
async def get_kiosk_info(
    kiosk_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    **Get current active session info for kiosk**
    
    Public endpoint untuk mendapatkan informasi sesi aktif kiosk.
    Menampilkan kelas/mata pelajaran yang sedang berlangsung.
    
    **Query Parameters:**
    - `kiosk_id`: Kiosk identifier (optional)
    
    **Response:**
    - `kelas_id`: Active class ID
    - `nama_kelas`: Class name
    - `mata_pelajaran`: Subject name
    - `ruangan`: Room location
    - `guru`: Teacher name
    - `waktu_mulai`: Session start time
    - `waktu_selesai`: Session end time
    - `status`: Session status (active/inactive)
    
    **Note:**
    Untuk implementasi lengkap, perlu tabel `schedules` untuk jadwal kelas.
    Saat ini mengembalikan data placeholder/mock.
    """
    try:
        # Get current time
        now = datetime.now()
        current_time = now.strftime("%H:%M:%S")
        current_day = now.strftime("%A")  # Monday, Tuesday, etc.
        
        # TODO: Query actual schedule from database
        # For now, return mock data
        
        # Mock: Get first available class
        kelas = db.query(Kelas).first()
        
        if not kelas:
            return {
                "status": "inactive",
                "message": "No active session at this time",
                "kiosk_id": kiosk_id,
                "current_time": current_time,
                "current_day": current_day
            }
        
        # Mock schedule data
        # In production, this should query from schedules table:
        # SELECT * FROM schedules 
        # WHERE hari = current_day 
        # AND waktu_mulai <= current_time 
        # AND waktu_selesai >= current_time
        # LIMIT 1
        
        return {
            "status": "active",
            "kelas_id": kelas.id,
            "nama_kelas": kelas.nama_kelas,
            "mata_pelajaran": "Matematika",  # TODO: Get from schedule
            "ruangan": "Lab Komputer 1",     # TODO: Get from schedule/kiosk config
            "guru": "Bu Siti",               # TODO: Get from schedule
            "waktu_mulai": "08:00:00",       # TODO: Get from schedule
            "waktu_selesai": "10:00:00",     # TODO: Get from schedule
            "kiosk_id": kiosk_id,
            "current_time": current_time,
            "current_day": current_day,
            "message": "Session active. Ready for attendance."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting kiosk info: {str(e)}")


@router.post("/face/check")
async def check_face_registration(
    image: str = Body(..., description="Base64 encoded image"),
    db: Session = Depends(get_db)
):
    """
    **Check if face is registered in the system**
    
    Public endpoint untuk mengecek apakah wajah sudah terdaftar.
    Berguna untuk verifikasi sebelum attendance atau registrasi baru.
    
    **Request Body:**
    - `image`: Base64 encoded image (required)
    
    **Response:**
    - `registered`: Boolean (true if face found, false otherwise)
    - `student_id`: Student ID if registered
    - `name`: Student name if registered
    - `nim`: Student NIM if registered
    - `kelas`: Student class if registered
    - `confidence`: Face recognition confidence score if registered
    - `message`: Status message
    
    **Use Cases:**
    1. Verify face before attendance marking
    2. Check if student needs to register
    3. Duplicate face detection during registration
    """
    try:
        # Decode base64 image
        if "," in image:
            image = image.split(",")[1]
        
        # Decode to PIL
        pil_image = decode_base64_image(image)
        
        # Initialize face service
        face_service = FaceService()
        
        # Load face encodings from database
        face_encodings_db = db.query(FaceEncoding).all()
        
        if not face_encodings_db:
            return {
                "registered": False,
                "message": "No registered faces in database"
            }
        
        # Deserialize encodings
        import pickle
        known_encodings = []
        user_ids = []
        
        for fe in face_encodings_db:
            try:
                encoding = pickle.loads(fe.encoding_data)
                known_encodings.append(encoding)
                user_ids.append(fe.user_id)
            except:
                continue
        
        # Recognize face
        result = face_service.recognize_face(pil_image, known_encodings, user_ids)
        
        if result is None:
            return {
                "registered": False,
                "message": "Face not found in system. Please register first."
            }
        
        user_id = result["user_id"]
        confidence = result["confidence"]
        
        # Get user info
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "registered": False,
                "message": "Face recognized but user not found in database."
            }
        
        return {
            "registered": True,
            "student_id": user.id,
            "name": user.name,
            "nim": user.nim,
            "kelas": user.kelas,
            "confidence": confidence,
            "message": f"Face registered for {user.name} ({user.nim})"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking face: {str(e)}")
