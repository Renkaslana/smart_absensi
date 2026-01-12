"""
Migration script to add default attendance time settings
Run this after creating the settings table
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.db.session import SessionLocal
from app.models.settings import Settings
import json


def create_default_settings():
    """Create default attendance time settings"""
    db = SessionLocal()
    
    try:
        # 1. Check attendance time settings
        existing = db.query(Settings).filter(Settings.key == "attendance_time_config").first()
        
        if not existing:
            # Create default settings
            default_config = {
                "early_time": "07:00",
                "late_threshold": "08:00",
                "early_label": "🌟 Siswa rajin dan baik!",
                "ontime_label": "⚠️ Hampir telat, hati-hati!",
                "late_label": "❌ Terlambat! Tingkatkan disiplin!"
            }
            
            setting = Settings(
                key="attendance_time_config",
                value=json.dumps(default_config),
                description="Attendance time thresholds and labels configuration. Admin can modify these values.",
                category="attendance",
                is_editable=True
            )
            
            db.add(setting)
            print("✅ Created attendance time settings")
        else:
            print("✅ Attendance time settings already exist")
        
        # 2. Check liveness detection settings
        liveness_existing = db.query(Settings).filter(Settings.key == "liveness_detection_config").first()
        
        if not liveness_existing:
            # Create default liveness settings (blink disabled for Asian face compatibility)
            liveness_config = {
                "enabled": True,  # Enabled by default
                "require_blink": False,  # Disabled - not reliable for Asian eyes
                "require_head_turn": True,  # Keep head turn - works perfectly
                "min_checks": 2,  # Left + Right turn
                "timeout": 30
            }
            
            liveness_setting = Settings(
                key="liveness_detection_config",
                value=json.dumps(liveness_config),
                description="Liveness detection configuration for public attendance. Blink disabled for Asian compatibility.",
                category="security",
                is_editable=True
            )
            
            db.add(liveness_setting)
            print("✅ Created liveness detection settings")
        else:
            print("✅ Liveness detection settings already exist")
        
        db.commit()
        
        print("=" * 60)
        print("✅ All default settings initialized successfully")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error creating default settings: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_default_settings()
