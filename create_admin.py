"""
Script untuk membuat admin user
Jalankan script ini sekali untuk membuat default admin account.
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.database.db_service import init_database, get_user_by_nim, create_user
from backend.utils.security import hash_password

def create_admin():
    """Create admin user if not exists"""
    print("=" * 50)
    print("Smart Absensi - Create Admin User")
    print("=" * 50)
    print()
    
    # Initialize database first
    print("Initializing database...")
    init_database()
    print("Database initialized successfully!")
    print()
    
    # Check if admin exists
    admin = get_user_by_nim('admin')
    
    if admin:
        print("Admin user already exists!")
        print(f"  NIM: {admin['nim']}")
        print(f"  Name: {admin['name']}")
        print(f"  Role: {admin['role']}")
        print()
        print("You can login with:")
        print("  NIM: admin")
        print("  Password: admin123")
    else:
        # Create admin user
        print("Creating admin user...")
        password_hash = hash_password('admin123')
        
        admin_user = create_user(
            nim='admin',
            name='Administrator',
            password_hash=password_hash,
            email='admin@smartabsensi.com',
            role='admin'
        )
        
        if admin_user:
            print("Admin user created successfully!")
            print()
            print("Admin credentials:")
            print("  NIM: admin")
            print("  Password: admin123")
            print("  Email: admin@smartabsensi.com")
        else:
            print("Failed to create admin user!")
    
    print()
    print("=" * 50)

if __name__ == '__main__':
    create_admin()

