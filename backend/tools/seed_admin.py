"""
Seed Admin User Script

This script creates a default admin user for the FahrenCenter system.
Run this after initializing the database.

Usage:
    cd backend
    python tools/seed_admin.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


def seed_admin():
    """Create default admin user"""
    db: Session = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.nim == "admin").first()
        
        if existing_admin:
            print("⚠️  Admin user already exists!")
            print(f"   NIM: {existing_admin.nim}")
            print(f"   Name: {existing_admin.name}")
            print(f"   Role: {existing_admin.role}")
            return
        
        # Create admin user
        admin_user = User(
            nim="admin",
            name="Administrator",
            email="admin@fahrencenter.sch.id",
            password_hash=get_password_hash("admin123"),
            role="admin",
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print(f"\n🔐 Login Credentials:")
        print(f"   Username: admin")
        print(f"   Password: admin123")
        print(f"\n📧 Email: admin@fahrencenter.sch.id")
        print(f"👤 Name: Administrator")
        print(f"🎯 Role: admin")
        print(f"\n⚠️  IMPORTANT: Change the password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


def seed_demo_student():
    """Create demo student user"""
    db: Session = SessionLocal()
    
    try:
        # Check if student already exists
        existing_student = db.query(User).filter(User.nim == "23215030").first()
        
        if existing_student:
            print("\n⚠️  Demo student already exists!")
            print(f"   NIM: {existing_student.nim}")
            print(f"   Name: {existing_student.name}")
            return
        
        # Create demo student
        student_user = User(
            nim="23215030",
            name="Demo Student",
            email="student@fahrencenter.sch.id",
            password_hash=get_password_hash("password123"),
            role="user",
            is_active=True
        )
        
        db.add(student_user)
        db.commit()
        db.refresh(student_user)
        
        print("\n✅ Demo student created successfully!")
        print(f"\n🔐 Login Credentials:")
        print(f"   NIM: 23215030")
        print(f"   Password: password123")
        print(f"\n📧 Email: student@fahrencenter.sch.id")
        print(f"👤 Name: Demo Student")
        print(f"🎯 Role: user")
        
    except Exception as e:
        print(f"❌ Error creating demo student: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🏫 FahrenCenter - Seed Admin & Demo Users")
    print("=" * 60)
    print()
    
    # Seed admin
    seed_admin()
    
    # Seed demo student
    seed_demo_student()
    
    print("\n" + "=" * 60)
    print("✨ Seeding completed!")
    print("=" * 60)
