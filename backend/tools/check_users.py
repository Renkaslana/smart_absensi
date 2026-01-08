"""
Check all users in database - Admin, Students, Teachers.
"""

import sys
sys.path.append('.')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User


def check_users():
    """Display all users grouped by role."""
    db: Session = SessionLocal()
    
    try:
        # Get all users
        all_users = db.query(User).all()
        total_users = len(all_users)
        
        # Group by role
        admins = [u for u in all_users if u.role == "admin"]
        students = [u for u in all_users if u.role == "user"]
        teachers = [u for u in all_users if u.role == "teacher"]
        
        print("\n" + "="*80)
        print("👥 USER DATABASE CHECK")
        print("="*80)
        print(f"\nTotal Users: {total_users}")
        print(f"  • Admins: {len(admins)}")
        print(f"  • Students: {len(students)}")
        print(f"  • Teachers: {len(teachers)}")
        
        # Display Admins
        if admins:
            print("\n" + "-"*80)
            print("👑 ADMINS")
            print("-"*80)
            for user in admins:
                print(f"  ID: {user.id:3d} | NIM: {user.nim:12s} | Name: {user.name:30s} | Email: {user.email}")
        
        # Display Students
        if students:
            print("\n" + "-"*80)
            print("🎓 STUDENTS")
            print("-"*80)
            for user in students[:10]:  # Show first 10
                face_status = "✅" if user.has_face else "❌"
                print(f"  ID: {user.id:3d} | NIM: {user.nim:12s} | Name: {user.name:30s} | Kelas: {user.kelas or 'N/A':10s} | Face: {face_status}")
            
            if len(students) > 10:
                print(f"  ... and {len(students) - 10} more students")
        
        # Display Teachers
        if teachers:
            print("\n" + "-"*80)
            print("👨‍🏫 TEACHERS")
            print("-"*80)
            for user in teachers:
                face_status = "✅" if user.has_face else "❌"
                print(f"  ID: {user.id:3d} | NIM: {user.nim:12s} | Name: {user.name:30s} | Face: {face_status}")
        
        print("\n" + "="*80)
        
        # Check for any issues
        print("\n🔍 DIAGNOSTIC CHECK:")
        if total_users == 0:
            print("  ⚠️  NO USERS FOUND! Database might be empty.")
        
        users_without_email = [u for u in all_users if not u.email]
        if users_without_email:
            print(f"  ⚠️  {len(users_without_email)} users without email")
        
        inactive_users = [u for u in all_users if not u.is_active]
        if inactive_users:
            print(f"  ⚠️  {len(inactive_users)} inactive users")
        
        print("\n✅ Check complete!")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    check_users()
