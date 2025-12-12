# =============================================================================
# DATABASE SERVICE - SQLite Version (Professional Academic System)
# =============================================================================
# Enhanced database service for Smart Absensi Academic System
# Features: Role-based access, duplicate prevention, comprehensive statistics

import sqlite3
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from pathlib import Path
import json
import logging

logger = logging.getLogger(__name__)

# Database path
DATABASE_PATH = Path(__file__).parent.parent.parent / "smart_absensi.db"


def get_connection():
    """Get database connection with foreign key support."""
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_database():
    """Initialize database schema with academic tables."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Create Users table with enhanced fields
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nim TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            password TEXT,
            role TEXT DEFAULT 'mahasiswa',
            kelas TEXT,
            jurusan TEXT,
            angkatan TEXT,
            foto_profil TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create FaceEmbeddings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS face_embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            encoding_file TEXT NOT NULL,
            num_encodings INTEGER DEFAULT 0,
            quality_score REAL DEFAULT 0,
            is_verified INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Create Absensi table with date constraint for duplicate prevention
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS absensi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            attendance_date DATE NOT NULL,
            status TEXT DEFAULT 'hadir',
            confidence REAL,
            photo_path TEXT,
            device TEXT,
            location TEXT,
            ip_address TEXT,
            notes TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, attendance_date)
        )
    """)
    
    # Create Sessions table for attendance sessions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    """)
    
    # Create Settings table for system configuration
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT,
            description TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create Activity Log table for audit trail
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            details TEXT,
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # Create indexes for better performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_nim ON users(nim)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_face_embeddings_user ON face_embeddings(user_id)")
    
    # Check if attendance_date column exists in absensi table (migration)
    cursor.execute("PRAGMA table_info(absensi)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'attendance_date' in columns:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_absensi_user_date ON absensi(user_id, attendance_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_absensi_date ON absensi(attendance_date)")
    else:
        # Migration: Add attendance_date column if it doesn't exist
        try:
            cursor.execute("ALTER TABLE absensi ADD COLUMN attendance_date DATE")
            # Update existing records to set attendance_date from timestamp
            cursor.execute("""
                UPDATE absensi 
                SET attendance_date = date(timestamp) 
                WHERE attendance_date IS NULL
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_absensi_user_date ON absensi(user_id, attendance_date)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_absensi_date ON absensi(attendance_date)")
        except Exception as e:
            logger.warning(f"Migration note: {e}")
    
    # Insert default settings
    default_settings = [
        ('attendance_start_time', '07:00', 'Jam mulai absensi'),
        ('attendance_end_time', '17:00', 'Jam akhir absensi'),
        ('min_confidence', '60.0', 'Minimum confidence untuk absensi'),
        ('max_photos_register', '10', 'Maksimal foto untuk registrasi wajah'),
        ('allow_multiple_attendance', '0', 'Izinkan absensi lebih dari sekali per hari'),
    ]
    
    for key, value, description in default_settings:
        cursor.execute("""
            INSERT OR IGNORE INTO settings (key, value, description)
            VALUES (?, ?, ?)
        """, (key, value, description))
    
    conn.commit()
    conn.close()
    
    logger.info("Database initialized successfully with academic schema")


# =============================================================================
# USER OPERATIONS
# =============================================================================

def create_user(
    nim: str,
    name: str,
    password_hash: Optional[str] = None,
    email: Optional[str] = None,
    role: str = "mahasiswa",
    kelas: Optional[str] = None,
    jurusan: Optional[str] = None,
    angkatan: Optional[str] = None
) -> Optional[Dict]:
    """Create new user (student without password for attendance-only)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO users (nim, name, email, password, role, kelas, jurusan, angkatan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (nim, name, email, password_hash, role, kelas, jurusan, angkatan))
        
        conn.commit()
        user_id = cursor.lastrowid
        
        return get_user_by_id(user_id)
    except sqlite3.IntegrityError:
        logger.warning(f"User with NIM {nim} already exists")
        return None
    finally:
        conn.close()


def create_student(
    nim: str,
    name: str,
    kelas: Optional[str] = None,
    jurusan: Optional[str] = None,
    angkatan: Optional[str] = None,
    email: Optional[str] = None
) -> Optional[Dict]:
    """Create student without password (for admin face registration flow)."""
    return create_user(
        nim=nim,
        name=name,
        password_hash=None,
        email=email,
        role="mahasiswa",
        kelas=kelas,
        jurusan=jurusan,
        angkatan=angkatan
    )


def get_user_by_id(user_id: int) -> Optional[Dict]:
    """Get user by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    
    conn.close()
    
    if row:
        return dict(row)
    return None


def get_user_by_nim(nim: str) -> Optional[Dict]:
    """Get user by NIM."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE nim = ?", (nim,))
    row = cursor.fetchone()
    
    conn.close()
    
    if row:
        return dict(row)
    return None


def get_all_users(role: Optional[str] = None, include_inactive: bool = False) -> List[Dict]:
    """Get all users, optionally filtered by role."""
    conn = get_connection()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if role:
        conditions.append("role = ?")
        params.append(role)
    
    if not include_inactive:
        conditions.append("is_active = 1")
    
    where_clause = " WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT * FROM users{where_clause} ORDER BY created_at DESC", params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_students_without_face() -> List[Dict]:
    """Get students who haven't registered their face yet."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT u.* FROM users u
        LEFT JOIN face_embeddings fe ON u.id = fe.user_id
        WHERE u.role = 'mahasiswa' AND u.is_active = 1 AND fe.id IS NULL
        ORDER BY u.name
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_students_with_face() -> List[Dict]:
    """Get students who have registered their face."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT u.*, fe.num_encodings, fe.quality_score, fe.is_verified
        FROM users u
        INNER JOIN face_embeddings fe ON u.id = fe.user_id
        WHERE u.role = 'mahasiswa' AND u.is_active = 1
        ORDER BY u.name
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def update_user(user_id: int, **kwargs) -> Optional[Dict]:
    """Update user fields."""
    conn = get_connection()
    cursor = conn.cursor()
    
    allowed_fields = ['name', 'email', 'password', 'role', 'kelas', 'jurusan', 'angkatan', 'foto_profil', 'is_active']
    updates = []
    values = []
    
    for field, value in kwargs.items():
        if field in allowed_fields:
            updates.append(f"{field} = ?")
            values.append(value)
    
    if not updates:
        conn.close()
        return get_user_by_id(user_id)
    
    values.append(datetime.now())
    values.append(user_id)
    
    cursor.execute(f"""
        UPDATE users 
        SET {', '.join(updates)}, updated_at = ?
        WHERE id = ?
    """, values)
    
    conn.commit()
    conn.close()
    
    return get_user_by_id(user_id)


def deactivate_user(user_id: int) -> bool:
    """Soft delete user by deactivating."""
    return update_user(user_id, is_active=0) is not None


def delete_user(user_id: int) -> bool:
    """Delete user and related data."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Delete related records
    cursor.execute("DELETE FROM face_embeddings WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM absensi WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    
    return affected > 0


# =============================================================================
# FACE EMBEDDING OPERATIONS
# =============================================================================

def save_face_embedding(
    user_id: int,
    encoding_file: str,
    num_encodings: int = 0,
    quality_score: float = 0.0
) -> Optional[Dict]:
    """Save face embedding record."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Check if user already has embedding
    cursor.execute("SELECT id FROM face_embeddings WHERE user_id = ?", (user_id,))
    existing = cursor.fetchone()
    
    if existing:
        # Update existing
        cursor.execute("""
            UPDATE face_embeddings 
            SET encoding_file = ?, num_encodings = ?, quality_score = ?, 
                is_verified = 1, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (encoding_file, num_encodings, quality_score, user_id))
    else:
        # Create new
        cursor.execute("""
            INSERT INTO face_embeddings (user_id, encoding_file, num_encodings, quality_score, is_verified)
            VALUES (?, ?, ?, ?, 1)
        """, (user_id, encoding_file, num_encodings, quality_score))
    
    conn.commit()
    
    cursor.execute("SELECT * FROM face_embeddings WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    
    conn.close()
    
    if row:
        return dict(row)
    return None


def delete_face_embedding(user_id: int) -> bool:
    """Delete face embedding for user."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM face_embeddings WHERE user_id = ?", (user_id,))
    
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    
    return affected > 0


def get_face_embedding(user_id: int) -> Optional[Dict]:
    """Get face embedding for user."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM face_embeddings WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    
    conn.close()
    
    if row:
        return dict(row)
    return None


def get_users_with_embeddings() -> List[Dict]:
    """Get users who have registered face embeddings."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT u.*, fe.encoding_file, fe.num_encodings
        FROM users u
        INNER JOIN face_embeddings fe ON u.id = fe.user_id
        ORDER BY u.name
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


# =============================================================================
# ABSENSI OPERATIONS - WITH DUPLICATE PREVENTION
# =============================================================================

def check_already_attended_today(user_id: int) -> Optional[Dict]:
    """
    Check if user has already submitted attendance today.
    CRITICAL: This prevents duplicate attendance per day.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    today = date.today().isoformat()
    
    cursor.execute("""
        SELECT a.*, u.name, u.nim
        FROM absensi a
        JOIN users u ON a.user_id = u.id
        WHERE a.user_id = ? AND a.attendance_date = ?
    """, (user_id, today))
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None


def create_absensi(
    user_id: int,
    status: str = "hadir",
    confidence: Optional[float] = None,
    photo_path: Optional[str] = None,
    device: Optional[str] = None,
    location: Optional[str] = None,
    ip_address: Optional[str] = None,
    notes: Optional[str] = None
) -> Optional[Dict]:
    """
    Create new absensi record with duplicate prevention.
    Returns existing record if already attended today.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    today = date.today().isoformat()
    
    # Check for existing attendance today (duplicate prevention)
    existing = check_already_attended_today(user_id)
    if existing:
        conn.close()
        return {"duplicate": True, "existing": existing}
    
    try:
        cursor.execute("""
            INSERT INTO absensi (user_id, attendance_date, status, confidence, photo_path, device, location, ip_address, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, today, status, confidence, photo_path, device, location, ip_address, notes))
        
        conn.commit()
        absensi_id = cursor.lastrowid
        
        cursor.execute("""
            SELECT a.*, u.name, u.nim
            FROM absensi a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?
        """, (absensi_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
        
    except sqlite3.IntegrityError as e:
        # Unique constraint violation - already attended
        conn.close()
        existing = check_already_attended_today(user_id)
        return {"duplicate": True, "existing": existing}


def get_absensi_by_user(
    user_id: int,
    limit: int = 100,
    offset: int = 0
) -> List[Dict]:
    """Get absensi history for user."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM absensi 
        WHERE user_id = ?
        ORDER BY attendance_date DESC, timestamp DESC
        LIMIT ? OFFSET ?
    """, (user_id, limit, offset))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_absensi_by_nim(
    nim: str,
    limit: int = 100,
    offset: int = 0
) -> List[Dict]:
    """Get absensi history for user by NIM (for public access)."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT a.*, u.name, u.nim, u.kelas
        FROM absensi a
        JOIN users u ON a.user_id = u.id
        WHERE u.nim = ?
        ORDER BY a.attendance_date DESC, a.timestamp DESC
        LIMIT ? OFFSET ?
    """, (nim, limit, offset))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_absensi_today(user_id: int) -> List[Dict]:
    """Get today's absensi for user."""
    conn = get_connection()
    cursor = conn.cursor()
    
    today = date.today().isoformat()
    
    cursor.execute("""
        SELECT * FROM absensi 
        WHERE user_id = ? AND attendance_date = ?
        ORDER BY timestamp DESC
    """, (user_id, today))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_today_attendance_count() -> int:
    """Get total attendance count for today."""
    conn = get_connection()
    cursor = conn.cursor()
    
    today = date.today().isoformat()
    
    cursor.execute("""
        SELECT COUNT(*) as count FROM absensi WHERE attendance_date = ?
    """, (today,))
    
    result = cursor.fetchone()
    conn.close()
    
    return result["count"] if result else 0


def get_today_attendance_list() -> List[Dict]:
    """Get all attendance records for today with user info."""
    conn = get_connection()
    cursor = conn.cursor()
    
    today = date.today().isoformat()
    
    cursor.execute("""
        SELECT a.*, u.name, u.nim, u.kelas, u.jurusan
        FROM absensi a
        JOIN users u ON a.user_id = u.id
        WHERE a.attendance_date = ?
        ORDER BY a.timestamp DESC
    """, (today,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_all_absensi(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    kelas: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 1000,
    offset: int = 0
) -> List[Dict]:
    """Get all absensi records with optional filters."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT a.*, u.name, u.nim, u.kelas, u.jurusan
        FROM absensi a
        JOIN users u ON a.user_id = u.id
        WHERE 1=1
    """
    params = []
    
    if date_from:
        query += " AND a.attendance_date >= ?"
        params.append(date_from)
    if date_to:
        query += " AND a.attendance_date <= ?"
        params.append(date_to)
    if kelas:
        query += " AND u.kelas = ?"
        params.append(kelas)
    if status:
        query += " AND a.status = ?"
        params.append(status)
    if search:
        query += " AND (u.name LIKE ? OR u.nim LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    
    query += " ORDER BY a.attendance_date DESC, a.timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def get_absensi_count(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    kelas: Optional[str] = None,
    status: Optional[str] = None
) -> int:
    """Get count of absensi records with optional filters."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT COUNT(*) as count
        FROM absensi a
        JOIN users u ON a.user_id = u.id
        WHERE 1=1
    """
    params = []
    
    if date_from:
        query += " AND a.attendance_date >= ?"
        params.append(date_from)
    if date_to:
        query += " AND a.attendance_date <= ?"
        params.append(date_to)
    if kelas:
        query += " AND u.kelas = ?"
        params.append(kelas)
    if status:
        query += " AND a.status = ?"
        params.append(status)
    
    cursor.execute(query, params)
    result = cursor.fetchone()
    conn.close()
    
    return result["count"] if result else 0


def get_absensi_statistics(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
) -> Dict:
    """Get comprehensive absensi statistics."""
    conn = get_connection()
    cursor = conn.cursor()
    
    today = date.today().isoformat()
    
    # Build date filter
    date_filter = ""
    params = []
    if date_from:
        date_filter += " AND a.attendance_date >= ?"
        params.append(date_from)
    if date_to:
        date_filter += " AND a.attendance_date <= ?"
        params.append(date_to)
    
    # Total absensi
    cursor.execute(f"""
        SELECT COUNT(*) as total FROM absensi a WHERE 1=1 {date_filter}
    """, params)
    total = cursor.fetchone()["total"]
    
    # Today's attendance
    cursor.execute("""
        SELECT COUNT(*) as today_count FROM absensi WHERE attendance_date = ?
    """, (today,))
    today_count = cursor.fetchone()["today_count"]
    
    # Total students
    cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'mahasiswa' AND is_active = 1")
    total_students = cursor.fetchone()["total"]
    
    # Students with face registered
    cursor.execute("""
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        INNER JOIN face_embeddings fe ON u.id = fe.user_id
        WHERE u.role = 'mahasiswa' AND u.is_active = 1
    """)
    registered_faces = cursor.fetchone()["count"]
    
    # Attendance rate today
    attendance_rate = (today_count / total_students * 100) if total_students > 0 else 0
    
    # Unique users who attended
    cursor.execute(f"""
        SELECT COUNT(DISTINCT user_id) as unique_users FROM absensi a WHERE 1=1 {date_filter}
    """, params)
    unique_users = cursor.fetchone()["unique_users"]
    
    # By status
    cursor.execute(f"""
        SELECT status, COUNT(*) as count FROM absensi a WHERE 1=1 {date_filter} GROUP BY status
    """, params)
    by_status = {row["status"]: row["count"] for row in cursor.fetchall()}
    
    # Daily summary (last 30 days)
    cursor.execute("""
        SELECT attendance_date as date, COUNT(*) as count
        FROM absensi
        WHERE attendance_date >= date('now', '-30 days')
        GROUP BY attendance_date
        ORDER BY attendance_date DESC
    """)
    daily = [dict(row) for row in cursor.fetchall()]
    
    # Weekly summary
    cursor.execute("""
        SELECT strftime('%W', attendance_date) as week, COUNT(*) as count
        FROM absensi
        WHERE attendance_date >= date('now', '-12 weeks')
        GROUP BY strftime('%W', attendance_date)
        ORDER BY week DESC
    """)
    weekly = [dict(row) for row in cursor.fetchall()]
    
    # By class (kelas)
    cursor.execute("""
        SELECT u.kelas, COUNT(*) as count
        FROM absensi a
        JOIN users u ON a.user_id = u.id
        WHERE a.attendance_date >= date('now', '-30 days') AND u.kelas IS NOT NULL
        GROUP BY u.kelas
        ORDER BY count DESC
    """)
    by_kelas = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_absensi": total,
        "today_count": today_count,
        "total_students": total_students,
        "registered_faces": registered_faces,
        "attendance_rate_today": round(attendance_rate, 1),
        "unique_users": unique_users,
        "by_status": by_status,
        "daily_summary": daily,
        "weekly_summary": weekly,
        "by_kelas": by_kelas
    }


def get_user_absensi_statistics(user_id: int) -> Dict:
    """Get comprehensive absensi statistics for specific user."""
    conn = get_connection()
    cursor = conn.cursor()
    
    today = date.today().isoformat()
    
    # Total absensi
    cursor.execute("""
        SELECT COUNT(*) as total FROM absensi WHERE user_id = ?
    """, (user_id,))
    total = cursor.fetchone()["total"]
    
    # This month
    cursor.execute("""
        SELECT COUNT(*) as count FROM absensi 
        WHERE user_id = ? AND strftime('%Y-%m', attendance_date) = strftime('%Y-%m', 'now')
    """, (user_id,))
    this_month = cursor.fetchone()["count"]
    
    # Last attendance
    cursor.execute("""
        SELECT MAX(attendance_date) as last FROM absensi WHERE user_id = ?
    """, (user_id,))
    last = cursor.fetchone()["last"]
    
    # Today's attendance
    cursor.execute("""
        SELECT * FROM absensi WHERE user_id = ? AND attendance_date = ?
    """, (user_id, today))
    today_attendance = cursor.fetchone()
    
    # By status
    cursor.execute("""
        SELECT status, COUNT(*) as count FROM absensi WHERE user_id = ? GROUP BY status
    """, (user_id,))
    by_status = {row["status"]: row["count"] for row in cursor.fetchall()}
    
    # Monthly attendance (last 6 months)
    cursor.execute("""
        SELECT strftime('%Y-%m', attendance_date) as month, COUNT(*) as count
        FROM absensi
        WHERE user_id = ? AND attendance_date >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', attendance_date)
        ORDER BY month DESC
    """, (user_id,))
    monthly = [dict(row) for row in cursor.fetchall()]
    
    # Recent attendance (last 10)
    cursor.execute("""
        SELECT * FROM absensi 
        WHERE user_id = ?
        ORDER BY attendance_date DESC
        LIMIT 10
    """, (user_id,))
    recent = [dict(row) for row in cursor.fetchall()]
    
    # Attendance streak
    cursor.execute("""
        SELECT attendance_date FROM absensi 
        WHERE user_id = ?
        ORDER BY attendance_date DESC
    """, (user_id,))
    dates = [row["attendance_date"] for row in cursor.fetchall()]
    
    streak = 0
    if dates:
        current = date.today()
        for d in dates:
            if isinstance(d, str):
                d = date.fromisoformat(d)
            if d == current or d == current - timedelta(days=1):
                streak += 1
                current = d - timedelta(days=1)
            else:
                break
    
    conn.close()
    
    return {
        "total_absensi": total,
        "this_month": this_month,
        "last_attendance": last,
        "attended_today": today_attendance is not None,
        "today_record": dict(today_attendance) if today_attendance else None,
        "by_status": by_status,
        "monthly_summary": monthly,
        "recent_attendance": recent,
        "current_streak": streak
    }


# =============================================================================
# SETTINGS OPERATIONS
# =============================================================================

def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    """Get setting value by key."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    
    conn.close()
    
    if row:
        return row["value"]
    return default


def update_setting(key: str, value: str) -> bool:
    """Update or create setting."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    """, (key, value, value))
    
    conn.commit()
    conn.close()
    
    return True


def get_all_settings() -> Dict[str, str]:
    """Get all settings as dictionary."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT key, value, description FROM settings")
    rows = cursor.fetchall()
    
    conn.close()
    
    return {row["key"]: {"value": row["value"], "description": row["description"]} for row in rows}


# =============================================================================
# ACTIVITY LOG OPERATIONS
# =============================================================================

def log_activity(
    action: str,
    user_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> bool:
    """Log an activity for audit trail."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, action, entity_type, entity_id, details, ip_address))
    
    conn.commit()
    conn.close()
    
    return True


def get_activity_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 100
) -> List[Dict]:
    """Get activity logs with optional filters."""
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT al.*, u.name as user_name, u.nim as user_nim
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
    """
    params = []
    
    if user_id:
        query += " AND al.user_id = ?"
        params.append(user_id)
    if action:
        query += " AND al.action = ?"
        params.append(action)
    
    query += " ORDER BY al.created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    conn.close()
    
    return [dict(row) for row in rows]


# =============================================================================
# CLASS/KELAS OPERATIONS
# =============================================================================

def get_all_kelas() -> List[str]:
    """Get list of unique kelas values."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT DISTINCT kelas FROM users 
        WHERE kelas IS NOT NULL AND kelas != '' AND is_active = 1
        ORDER BY kelas
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [row["kelas"] for row in rows]


def get_students_by_kelas(kelas: str) -> List[Dict]:
    """Get students by kelas."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT u.*, fe.num_encodings, fe.is_verified
        FROM users u
        LEFT JOIN face_embeddings fe ON u.id = fe.user_id
        WHERE u.kelas = ? AND u.role = 'mahasiswa' AND u.is_active = 1
        ORDER BY u.name
    """, (kelas,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


# =============================================================================
# ATTENDANCE SESSION OPERATIONS
# =============================================================================

def create_attendance_session(
    name: str,
    start_time: datetime,
    end_time: datetime,
    description: Optional[str] = None,
    created_by: Optional[int] = None
) -> Optional[Dict]:
    """Create new attendance session."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO attendance_sessions (name, description, start_time, end_time, created_by)
        VALUES (?, ?, ?, ?, ?)
    """, (name, description, start_time, end_time, created_by))
    
    conn.commit()
    session_id = cursor.lastrowid
    
    cursor.execute("SELECT * FROM attendance_sessions WHERE id = ?", (session_id,))
    row = cursor.fetchone()
    
    conn.close()
    
    if row:
        return dict(row)
    return None


def get_active_sessions() -> List[Dict]:
    """Get all active attendance sessions."""
    conn = get_connection()
    cursor = conn.cursor()
    
    now = datetime.now()
    
    cursor.execute("""
        SELECT * FROM attendance_sessions 
        WHERE is_active = 1 
        AND datetime(start_time) <= datetime(?)
        AND datetime(end_time) >= datetime(?)
        ORDER BY start_time
    """, (now, now))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


# Initialize database on import
init_database()
