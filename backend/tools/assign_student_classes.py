"""
Script to assign random classes to students.
Will assign random classes from SD to SMA, except for NIM 24225046 which gets SMA.
"""
import sys
import os
import random

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User

# Class options
CLASSES = {
    'SD': ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'],
    'SMP': ['7A', '7B', '8A', '8B', '9A', '9B'],
    'SMA': ['10 IPA 1', '10 IPA 2', '10 IPS 1', '10 IPS 2',
            '11 IPA 1', '11 IPA 2', '11 IPS 1', '11 IPS 2',
            '12 IPA 1', '12 IPA 2', '12 IPS 1', '12 IPS 2']
}

def get_random_class():
    """Get a random class from SD, SMP, or SMA"""
    level = random.choice(['SD', 'SMP', 'SMA'])
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
