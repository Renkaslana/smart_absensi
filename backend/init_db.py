"""
Database initialization script for Smart Absensi
Run this script to create the database and tables
"""

import sqlite3
import os
from datetime import datetime

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'absensi.db')

def init_database():
    """Initialize the database with all required tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nim TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'mahasiswa',
            face_registered INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Face embeddings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS face_embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            encoding BLOB NOT NULL,
            image_path TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # Absensi table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS absensi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tanggal TEXT NOT NULL,
            waktu TEXT NOT NULL,
            status TEXT NOT NULL,
            confidence REAL,
            keterangan TEXT,
            device_info TEXT,
            location TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # Sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            refresh_token TEXT,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_nim ON users(nim)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_absensi_user_id ON absensi(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_face_user_id ON face_embeddings(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)')
    
    conn.commit()
    conn.close()
    
    print(f"✅ Database initialized successfully at: {DB_PATH}")
    return True


def create_admin_user(nim: str, name: str, password: str, email: str = None):
    """Create an admin user"""
    import bcrypt
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        cursor.execute('''
            INSERT INTO users (nim, name, email, password_hash, role)
            VALUES (?, ?, ?, ?, 'admin')
        ''', (nim, name, email, password_hash))
        
        conn.commit()
        print(f"✅ Admin user '{name}' created successfully!")
        return True
    except sqlite3.IntegrityError:
        print(f"⚠️ User with NIM '{nim}' already exists")
        return False
    finally:
        conn.close()


def seed_sample_data():
    """Seed some sample data for testing"""
    import bcrypt
    import random
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Sample users
    sample_users = [
        ('123456789', 'Ahmad Fauzi', 'ahmad@email.com'),
        ('123456790', 'Budi Santoso', 'budi@email.com'),
        ('123456791', 'Cindy Wijaya', 'cindy@email.com'),
        ('123456792', 'Dewi Anggraeni', 'dewi@email.com'),
        ('123456793', 'Eko Prasetyo', 'eko@email.com'),
    ]
    
    password_hash = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    for nim, name, email in sample_users:
        try:
            cursor.execute('''
                INSERT INTO users (nim, name, email, password_hash, role, face_registered)
                VALUES (?, ?, ?, ?, 'mahasiswa', ?)
            ''', (nim, name, email, password_hash, random.choice([0, 1])))
        except sqlite3.IntegrityError:
            pass
    
    conn.commit()
    
    # Sample absensi data
    statuses = ['hadir', 'hadir', 'hadir', 'terlambat', 'tidak_hadir']
    times = ['07:25', '07:30', '07:45', '08:10', '-']
    
    cursor.execute('SELECT id FROM users WHERE role = "mahasiswa"')
    user_ids = [row[0] for row in cursor.fetchall()]
    
    for user_id in user_ids:
        for day in range(1, 6):
            status = random.choice(statuses)
            waktu = times[statuses.index(status)] if status != 'tidak_hadir' else '-'
            tanggal = f'2024-12-0{day}'
            
            try:
                cursor.execute('''
                    INSERT INTO absensi (user_id, tanggal, waktu, status, confidence)
                    VALUES (?, ?, ?, ?, ?)
                ''', (user_id, tanggal, waktu, status, random.uniform(0.85, 0.98) if status != 'tidak_hadir' else None))
            except:
                pass
    
    conn.commit()
    conn.close()
    
    print("✅ Sample data seeded successfully!")


if __name__ == '__main__':
    print("=" * 50)
    print("Smart Absensi - Database Setup")
    print("=" * 50)
    print()
    
    # Initialize database
    init_database()
    
    # Create admin user
    print()
    print("Creating admin user...")
    create_admin_user(
        nim='admin',
        name='Administrator',
        password='admin123',
        email='admin@smartabsensi.com'
    )
    
    # Seed sample data
    print()
    print("Seeding sample data...")
    seed_sample_data()
    
    print()
    print("=" * 50)
    print("Setup complete!")
    print()
    print("Admin credentials:")
    print("  NIM: admin")
    print("  Password: admin123")
    print()
    print("Sample user credentials:")
    print("  NIM: 123456789")
    print("  Password: password123")
    print("=" * 50)
