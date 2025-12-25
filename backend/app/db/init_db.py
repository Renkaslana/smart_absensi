"""
Database initialization script.
Creates all tables and optionally seeds initial data.
"""

import os
from sqlalchemy.orm import Session
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings


def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")


def create_admin_user(db: Session):
    """Create default admin user if not exists."""
    admin = db.query(User).filter(User.nim == "admin").first()
    
    if not admin:
        print("Creating default admin user...")
        admin = User(
            nim="admin",
            name="Administrator",
            email="admin@absensi.ac.id",
            password_hash=get_password_hash("admin123"),  # Change in production!
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("✅ Admin user created!")
        print("   NIM: admin")
        print("   Password: admin123")
        print("   ⚠️  Please change the password after first login!")
    else:
        print("✅ Admin user already exists")


def create_storage_directories():
    """Create necessary storage directories."""
    directories = [
        "database",
        settings.FACE_STORAGE_PATH,
        "logs"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    
    print("✅ Storage directories created!")


def init_db():
    """Initialize the database."""
    print("="*60)
    print("🚀 Initializing Smart Absensi Database...")
    print("="*60)
    
    # Create storage directories
    create_storage_directories()
    
    # Create tables
    create_tables()
    
    # Create default admin
    db = SessionLocal()
    try:
        create_admin_user(db)
    finally:
        db.close()
    
    print("="*60)
    print("✅ Database initialization complete!")
    print("="*60)


if __name__ == "__main__":
    init_db()
