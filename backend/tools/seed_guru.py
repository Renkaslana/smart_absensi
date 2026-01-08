"""
Seeder for creating test teachers.
"""

import sys
sys.path.append('.')

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


def seed_teachers():
    """Create test teachers."""
    db: Session = SessionLocal()
    
    try:
        teachers_data = [
            {
                "nim": "GURU001",
                "name": "Budi Santoso",
                "email": "budi.santoso@fahrencenter.ac.id",
                "password": "password123",
                "role": "teacher",
                "kelas": None,
            },
            {
                "nim": "GURU002",
                "name": "Siti Rahayu",
                "email": "siti.rahayu@fahrencenter.ac.id",
                "password": "password123",
                "role": "teacher",
                "kelas": None,
            },
            {
                "nim": "GURU003",
                "name": "Ahmad Wijaya",
                "email": "ahmad.wijaya@fahrencenter.ac.id",
                "password": "password123",
                "role": "teacher",
                "kelas": None,
            },
        ]
        
        created_count = 0
        
        for teacher_data in teachers_data:
            # Check if teacher already exists
            existing = db.query(User).filter(User.nim == teacher_data["nim"]).first()
            
            if existing:
                print(f"❌ Teacher {teacher_data['nim']} already exists")
                continue
            
            # Create teacher
            teacher = User(
                nim=teacher_data["nim"],
                name=teacher_data["name"],
                email=teacher_data["email"],
                password_hash=get_password_hash(teacher_data["password"]),
                role=teacher_data["role"],
                kelas=teacher_data["kelas"],
                is_active=True,
                has_face=False
            )
            
            db.add(teacher)
            created_count += 1
            print(f"✅ Created teacher: {teacher_data['name']} ({teacher_data['nim']})")
        
        db.commit()
        print(f"\n🎉 Successfully created {created_count} teachers!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Seeding teachers...")
    seed_teachers()
