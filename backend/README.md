# Smart Absensi Backend API

Backend API untuk sistem absensi berbasis face recognition menggunakan FastAPI, SQLite, dan face_recognition library.

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and change the secret keys!
# IMPORTANT: Change SECRET_KEY and JWT_SECRET_KEY in production
```

### 3. Initialize Database

```bash
# Create database and tables
python -m app.db.init_db
```

This will create:
- SQLite database at `database/absensi.db`
- Storage directories for face images
- Default admin user (nim: admin, password: admin123)

### 4. Run Server

```bash
# Development mode (with auto-reload)
python run.py

# Or using uvicorn directly
uvicorn app.main:app --reload --port 8001
```

Server akan berjalan di:
- **API:** http://localhost:8001
- **Docs:** http://localhost:8001/docs (Interactive API documentation)
- **ReDoc:** http://localhost:8001/redoc (Alternative documentation)

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/                    # API routes
│   │   ├── deps.py            # Dependencies (auth, db)
│   │   └── v1/                # API v1 endpoints
│   │       ├── auth.py        # Authentication routes
│   │       ├── face.py        # Face recognition routes
│   │       ├── absensi.py     # Attendance routes
│   │       ├── admin.py       # Admin routes
│   │       └── public.py      # Public routes
│   ├── core/                  # Core functionality
│   │   ├── config.py          # Settings
│   │   ├── security.py        # JWT, password hashing
│   │   └── exceptions.py      # Custom exceptions
│   ├── db/                    # Database
│   │   ├── session.py         # DB session
│   │   ├── base.py            # Base model
│   │   └── init_db.py         # DB initialization
│   ├── models/                # SQLAlchemy models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic
│   ├── utils/                 # Utilities
│   └── main.py                # FastAPI app
├── database/                  # SQLite database location
│   ├── absensi.db            # Main database file
│   └── wajah_siswa/          # Face images storage
├── logs/                      # Application logs
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables
└── run.py                     # Simple runner script
```

## 🔑 Default Credentials

After running `init_db.py`, use these credentials to login:

- **NIM:** admin
- **Password:** admin123

⚠️ **IMPORTANT:** Change the admin password after first login!

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## 📊 Database

The application uses SQLite for simplicity and ease of deployment:

- **Database file:** `database/absensi.db`
- **Backup:** Just copy the `.db` file
- **View data:** Use DB Browser for SQLite or similar tools

### Backup Database

```bash
# Backup database
cp database/absensi.db backups/absensi_backup_$(date +%Y%m%d).db

# Backup face images
tar -czf backups/faces_$(date +%Y%m%d).tar.gz database/wajah_siswa/
```

## 🎯 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login
- `POST /refresh` - Refresh access token
- `GET /me` - Get current user info
- `PUT /change-password` - Change password

### Face Recognition (`/api/v1/face`)
- `POST /scan` - Scan and recognize face
- `POST /register` - Register user's face
- `GET /status` - Check face registration status
- `DELETE /unregister` - Delete face data

### Attendance (`/api/v1/absensi`)
- `POST /submit` - Submit attendance
- `GET /history` - Get attendance history
- `GET /today` - Get today's attendance
- `GET /statistics` - Get user statistics

### Admin (`/api/v1/admin`)
- `GET /dashboard` - Dashboard data
- `GET /students` - List all students
- `GET /statistics` - System statistics
- `GET /report` - Generate reports

### Public (`/api/v1/public`)
- `POST /scan-attendance` - Public attendance (no auth)
- `GET /today-stats` - Today's statistics

## 🔒 Security

- **JWT Authentication** with access and refresh tokens
- **Password Hashing** using bcrypt
- **CORS** configured for frontend origins
- **Input Validation** using Pydantic schemas
- **SQL Injection** prevented by SQLAlchemy ORM

## 🛠️ Development

```bash
# Install development dependencies
pip install pytest pytest-asyncio httpx black flake8

# Format code
black app/

# Lint code
flake8 app/

# Run development server
python run.py
```

## 🚀 Deployment

### Simple Deployment

```bash
# Using Gunicorn
gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

### Docker Deployment (Optional)

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## 📝 Notes

- Designed for educational purposes and small-scale deployments (1-3 classes, < 150 users)
- SQLite is sufficient for this scale; migrate to PostgreSQL if scaling to > 200 users
- Face recognition works best with good lighting and frontal face images
- Minimum 3 face images required for registration

## 🐛 Troubleshooting

### Database Locked Error
```bash
# Stop the server and delete .db-wal and .db-shm files
rm database/absensi.db-wal database/absensi.db-shm
```

### Face Recognition Import Error
```bash
# Install dlib dependencies (Windows may need CMake)
pip install cmake
pip install dlib
pip install face-recognition
```

### Port Already in Use
```bash
# Change port in run.py or:
uvicorn app.main:app --port 8002
```

## 📞 Support

Untuk pertanyaan atau bantuan, silakan buka issue di repository ini.

---

**Dibuat dengan 💙 oleh Luna (GitHub Copilot)**  
**Versi:** 1.0 - SQLite Edition
