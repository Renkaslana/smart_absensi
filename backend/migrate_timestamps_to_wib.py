"""
Migration Script: Convert existing UTC timestamps to WIB (UTC+7)

This script migrates existing attendance records that were stored with UTC timestamps
to WIB (Western Indonesian Time, UTC+7) timezone.

IMPORTANT: 
- This script assumes existing timestamps are in UTC
- It adds 7 hours to convert UTC to WIB
- Backup your database before running this script!

Usage:
    python backend/migrate_timestamps_to_wib.py
"""

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Database path
DATABASE_PATH = Path(__file__).parent.parent / "smart_absensi.db"

def migrate_timestamps():
    """Migrate UTC timestamps to WIB by adding 7 hours."""
    
    if not DATABASE_PATH.exists():
        print(f"❌ Database not found at: {DATABASE_PATH}")
        print("   Please ensure the database file exists.")
        return False
    
    # Backup database first
    backup_path = DATABASE_PATH.parent / f"smart_absensi_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
    print(f"📦 Creating backup: {backup_path}")
    
    try:
        import shutil
        shutil.copy2(DATABASE_PATH, backup_path)
        print(f"✅ Backup created successfully")
    except Exception as e:
        print(f"❌ Failed to create backup: {e}")
        response = input("Continue without backup? (y/N): ")
        if response.lower() != 'y':
            return False
    
    conn = sqlite3.connect(str(DATABASE_PATH))
    cursor = conn.cursor()
    
    try:
        # Get all records with timestamps
        cursor.execute("""
            SELECT id, timestamp 
            FROM absensi 
            WHERE timestamp IS NOT NULL
        """)
        
        records = cursor.fetchall()
        print(f"\n📊 Found {len(records)} attendance records to migrate")
        
        if len(records) == 0:
            print("✅ No records to migrate")
            conn.close()
            return True
        
        # Ask for confirmation
        print("\n⚠️  WARNING: This will modify existing timestamps!")
        print("   - Assumes existing timestamps are in UTC")
        print("   - Will add 7 hours to convert to WIB (UTC+7)")
        print(f"   - Backup saved at: {backup_path}")
        
        response = input("\nContinue with migration? (y/N): ")
        if response.lower() != 'y':
            print("❌ Migration cancelled")
            conn.close()
            return False
        
        migrated_count = 0
        error_count = 0
        
        for record_id, timestamp_str in records:
            try:
                # Parse timestamp (assume UTC)
                if ' ' in timestamp_str and 'T' not in timestamp_str:
                    # SQLite format: 'YYYY-MM-DD HH:MM:SS'
                    dt = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                elif 'T' in timestamp_str:
                    # ISO format
                    if '+' in timestamp_str or 'Z' in timestamp_str:
                        # Already has timezone, skip
                        continue
                    dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                else:
                    # Try to parse as-is
                    dt = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                
                # Add 7 hours for WIB (UTC+7)
                wib_dt = dt + timedelta(hours=7)
                wib_str = wib_dt.strftime('%Y-%m-%d %H:%M:%S')
                
                # Update record
                cursor.execute("""
                    UPDATE absensi 
                    SET timestamp = ? 
                    WHERE id = ?
                """, (wib_str, record_id))
                
                migrated_count += 1
                
            except Exception as e:
                print(f"⚠️  Error migrating record {record_id}: {e}")
                error_count += 1
                continue
        
        conn.commit()
        conn.close()
        
        print(f"\n✅ Migration completed!")
        print(f"   - Migrated: {migrated_count} records")
        print(f"   - Errors: {error_count} records")
        print(f"   - Backup: {backup_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        conn.close()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Timestamp Migration Script: UTC → WIB")
    print("=" * 60)
    print()
    
    success = migrate_timestamps()
    
    if success:
        print("\n✅ Migration script completed successfully")
        sys.exit(0)
    else:
        print("\n❌ Migration script failed")
        sys.exit(1)
