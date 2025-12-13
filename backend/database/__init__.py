# Database Module - Enhanced for Academic System
from .db_service import (
    init_database,
    get_connection,
    get_wib_now,
    
    # User operations
    create_user,
    create_student,
    get_user_by_id,
    get_user_by_nim,
    get_all_users,
    update_user,
    delete_user,
    deactivate_user,
    get_students_without_face,
    get_students_with_face,
    
    # Face embedding operations
    save_face_embedding,
    get_face_embedding,
    get_users_with_embeddings,
    delete_face_embedding,
    
    # Absensi operations
    create_absensi,
    get_absensi_by_user,
    get_absensi_by_nim,
    get_absensi_today,
    get_all_absensi,
    get_absensi_count,
    get_absensi_statistics,
    get_user_absensi_statistics,
    check_already_attended_today,
    get_today_attendance_count,
    get_today_attendance_list,
    
    # Session operations
    create_attendance_session,
    get_active_sessions,
    
    # Settings operations
    get_setting,
    update_setting,
    get_all_settings,
    
    # Activity log operations
    log_activity,
    get_activity_logs,
    
    # Class operations
    get_all_kelas,
    get_students_by_kelas,
)

__all__ = [
    # Core
    "init_database",
    "get_connection",
    "get_wib_now",
    
    # Users
    "create_user",
    "create_student",
    "get_user_by_id",
    "get_user_by_nim",
    "get_all_users",
    "update_user",
    "delete_user",
    "deactivate_user",
    "get_students_without_face",
    "get_students_with_face",
    
    # Face
    "save_face_embedding",
    "get_face_embedding",
    "get_users_with_embeddings",
    "delete_face_embedding",
    
    # Absensi
    "create_absensi",
    "get_absensi_by_user",
    "get_absensi_by_nim",
    "get_absensi_today",
    "get_all_absensi",
    "get_absensi_count",
    "get_absensi_statistics",
    "get_user_absensi_statistics",
    "check_already_attended_today",
    "get_today_attendance_count",
    "get_today_attendance_list",
    
    # Sessions
    "create_attendance_session",
    "get_active_sessions",
    
    # Settings
    "get_setting",
    "update_setting",
    "get_all_settings",
    
    # Activity Logs
    "log_activity",
    "get_activity_logs",
    
    # Class/Kelas
    "get_all_kelas",
    "get_students_by_kelas",
]
