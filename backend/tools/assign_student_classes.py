"""
Script to assign random classes to students.
Uses the international naming structure from seed_kelas.py:
- SD: SD-G1-A to SD-G6-B (Grades 1-6, sections A-B)
- SMP: SMP-G7-A to SMP-G9-C (Grades 7-9, sections A-B-C)
- SMA: SMA-CAM-IGCSE-SCI, SMA-CAM-AS-HUM, SMA-CAM-ALEVEL-DIP (Cambridge-style)
- SMK: SMK-TI-INT, SMK-ENG-INT, SMK-BA-GLO (Technical international)
Special: NIM 24225046 gets SMA only.
"""
import sys
import os
import random

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User

# Class options matching seed_kelas.py structure
CLASSES = {
    'SD': [f'SD-G{grade}-{section}' for grade in range(1, 7) for section in ['A', 'B']],
    'SMP': [f'SMP-G{grade}-{section}' for grade in range(7, 10) for section in ['A', 'B', 'C']],
    'SMA': ['SMA-CAM-IGCSE-SCI', 'SMA-CAM-AS-HUM', 'SMA-CAM-ALEVEL-DIP'],
    'SMK': ['SMK-TI-INT', 'SMK-ENG-INT', 'SMK-BA-GLO']
}

def get_random_class():
    """Get a random class from SD, SMP, SMA, or SMK"""
    level = random.choice(['SD', 'SMP', 'SMA', 'SMK'])
    return random.choice(CLASSES[level])

def assign_classes(db: Session):
    """Assign random classes to all students"""
    students = db.query(User).filter(User.role == 'user').all()
    
    if not students:
        print("❌ No students found")
        return
    
    print(f"📚 Found {len(students)} students")
    print("🎲 Assigning random classes...\n")
    
    updated_count = 0
    for student in students:
        # Special case for NIM 24225046
        if student.nim == '24225046':
            new_class = random.choice(CLASSES['SMA'])
            print(f"✨ {student.nim} ({student.name}): {new_class} [SPECIAL - SMA only]")
        else:
            new_class = get_random_class()
            print(f"  {student.nim} ({student.name}): {new_class}")
        
        student.kelas = new_class
        updated_count += 1
    
    try:
        db.commit()
        print(f"\n✅ Successfully assigned classes to {updated_count} students")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")

def main():
    db = SessionLocal()
    try:
        assign_classes(db)
    finally:
        db.close()

if __name__ == "__main__":
    main()
