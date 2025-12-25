# 🎯 Rencana Arsitektur Backend - Smart Absensi System

**Dibuat pada:** 25 Desember 2025  
**Untuk Aplikasi:** Smart Absensi - Face Recognition Attendance System  
**Revisi:** 2.0 - SQLite Edition (Simplified & Educational) 💙

---

## 📋 Executive Summary

Backend ini dirancang untuk mendukung sistem absensi berbasis face recognition dengan fitur keamanan liveness detection. Sistem akan melayani frontend Next.js dengan REST API yang **robust, maintainable, dan mudah dipelajari**.

### 🎯 Filosofi Desain:
> **"Start Simple, Scale When Needed"**  
> Fokus pada pembelajaran face recognition & API design, bukan kompleksitas infrastruktur.

### Teknologi Stack Utama:
- **Framework:** FastAPI (Python)
- **Database:** SQLite dengan SQLAlchemy ORM
- **Face Recognition:** face_recognition library (HOG + CNN)
- **Liveness Detection:** MediaPipe Face Mesh
- **Authentication:** JWT (Access + Refresh Token)
- **File Storage:** Local file system (organized)

### 💡 Kenapa SQLite?
✅ **Zero setup** - Tidak perlu install database server  
✅ **Single file** - Mudah backup & portable  
✅ **Cukup untuk 1 kelas** (30-50 mahasiswa)  
✅ **Fokus ke face recognition** - Bukan kompleksitas DB  
✅ **Mudah di-migrate** - Ke PostgreSQL nanti dengan SQLAlchemy  
✅ **Stabil & reliable** - Digunakan oleh jutaan aplikasi

---

## 🏗️ Arsitektur Sistem

### 1. Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS/REST
┌─────────────────────────────────────────────────────────┐
│                   API Gateway / Nginx                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│            FastAPI Application (Backend Core)            │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Authentication Layer (JWT Middleware)          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Route Handlers (Controllers)                   │   │
│  │  - Auth Routes      - Face Routes               │   │
│  │  - Absensi Routes   - Admin Routes              │   │
│  │  - Public Routes                                │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Business Logic Layer (Services)                │   │
│  │  - Face Recognition Service                     │   │
│  │  - Liveness Detection Service                   │   │
│  │  - Attendance Service                           │   │
│  │  - User Management Service                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Data Access Layer (Repositories)               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
          ↓                    ↓                ↓
┌──────────────────┐  ┌──────────────┐  ┌────────────────┐
│   PostgreSQL     │  │    Redis     │  │  File Storage  │
│   (Main DB)      │  │ (Cache/Jobs) │  │  (Face Data)   │
└──────────────────┘  └──────────────┘  └────────────────┘
```

---

## 📁 Struktur Direktori Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # Entry point FastAPI
│   ├── config.py                    # Configuration & environment
│   │
│   ├── api/                         # API Routes
│   │   ├── __init__.py
│   │   ├── deps.py                  # Dependencies (auth, db session)
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── auth.py              # /auth endpoints
│   │       ├── face.py              # /face endpoints
│   │       ├── absensi.py           # /absensi endpoints
│   │       ├── admin.py             # /admin endpoints
│   │       └── public.py            # /public endpoints
│   │
│   ├── core/                        # Core functionality
│   │   ├── __init__.py
│   │   ├── security.py              # JWT, password hashing
│   │   ├── config.py                # Settings management
│   │   └── exceptions.py            # Custom exceptions
│   │
│   ├── db/                          # Database
│   │   ├── __init__.py
│   │   ├── base.py                  # SQLAlchemy base
│   │   ├── session.py               # DB session management
│   │   └── init_db.py               # Database initialization
│   │
│   ├── models/                      # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py                  # User model
│   │   ├── absensi.py               # Attendance model
│   │   ├── face_encoding.py         # Face data model
│   │   └── audit_log.py             # Audit trail
│   │
│   ├── schemas/                     # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── absensi.py
│   │   ├── face.py
│   │   └── common.py
│   │
│   ├── services/                    # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── face_recognition_service.py
│   │   ├── liveness_detection_service.py
│   │   ├── attendance_service.py
│   │   ├── admin_service.py
│   │   └── notification_service.py
│   │
│   ├── repositories/                # Data access layer
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   ├── absensi_repository.py
│   │   └── face_repository.py
│   │
│   ├── utils/                       # Utilities
│   │   ├── __init__.py
│   │   ├── image_processing.py     # Image manipulation
│   │   ├── validators.py           # Input validation
│   │   └── helpers.py              # Helper functions
│   │
│   └── workers/                     # Background tasks
│       ├── __init__.py
│       ├── celery_app.py
│       └── tasks.py                # Async tasks (email, reports)
│
├── tests/                           # Unit & integration tests
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_face.py
│   └── test_absensi.py
│
├── alembic/                         # Database migrations
│   ├── versions/
│   └── env.py
│
├── storage/                         # Local file storage
│   ├── faces/                       # Face images
│   ├── temp/                        # Temporary files
│   └── exports/                     # Generated reports
│
├── requirements.txt                 # Python dependencies
├── requirements-dev.txt             # Development dependencies
├── .env.example                     # Environment template
├── .env                             # Environment variables (gitignored)
├── alembic.ini                      # Alembic configuration
├── pytest.ini                       # Pytest configuration
└── README.md                        # Backend documentation
```

---

## 🗄️ Database Schema

### Tables & Relationships

#### 1. **users**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nim VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',  -- 'user' or 'admin'
    kelas VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    has_face BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    INDEX idx_nim (nim),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);
```

#### 2. **face_encodings**
```sql
CREATE TABLE face_encodings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    encoding_data BYTEA NOT NULL,           -- Serialized numpy array
    image_path VARCHAR(255),                -- Original image path
    confidence FLOAT,                       -- Quality score
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id)
);
```

#### 3. **absensi**
```sql
CREATE TABLE absensi (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'hadir',     -- hadir, terlambat, izin, sakit
    confidence FLOAT,                       -- Recognition confidence
    image_path VARCHAR(255),                -- Snapshot at attendance
    device_info TEXT,                       -- Browser/device info
    ip_address VARCHAR(45),
    location VARCHAR(100),                  -- Optional geolocation
    
    UNIQUE (user_id, date),                 -- One attendance per day
    INDEX idx_user_date (user_id, date),
    INDEX idx_date (date),
    INDEX idx_status (status)
);
```

#### 4. **refresh_tokens**
```sql
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
);
```

#### 5. **audit_logs**
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,           -- login, register_face, submit_attendance
    entity_type VARCHAR(50),                -- user, absensi, face
    entity_id INTEGER,
    details JSONB,                          -- Additional metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
```

#### 6. **liveness_checks**
```sql
CREATE TABLE liveness_checks (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_type VARCHAR(50),             -- blink, head_movement, smile
    result BOOLEAN,
    confidence FLOAT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id)
);
```

---

## 🔌 API Endpoints

### **1. Authentication Routes** (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login dengan NIM & password | No |
| POST | `/logout` | Logout user | Yes |
| POST | `/refresh` | Refresh access token | No (refresh token) |
| GET | `/me` | Get current user info | Yes |
| PUT | `/change-password` | Change password | Yes |

**Request/Response Samples:**

```python
# POST /auth/login
{
    "nim": "23215008",
    "password": "password123"
}

# Response
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "nim": "23215008",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "has_face": true,
        "kelas": "TI-3A"
    }
}
```

---

### **2. Face Recognition Routes** (`/api/v1/face`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/scan` | Scan wajah (detect + recognize) | Yes |
| POST | `/register` | Register wajah user | Yes |
| POST | `/register-upload` | Upload foto untuk registrasi | Yes |
| POST | `/verify` | Verifikasi wajah dengan liveness | Yes |
| DELETE | `/unregister` | Hapus data wajah | Yes |
| GET | `/status` | Cek status registrasi wajah | Yes |
| POST | `/admin/register` | Admin register wajah untuk user | Admin |
| POST | `/admin/register-upload` | Admin upload foto user | Admin |
| DELETE | `/admin/unregister/{user_id}` | Admin hapus wajah user | Admin |
| GET | `/registered-users` | List semua user dengan wajah terdaftar | Admin |

**Request/Response Samples:**

```python
# POST /face/scan
{
    "image": "base64_encoded_image_string"
}

# Response
{
    "recognized": true,
    "faces": [
        {
            "user_id": 1,
            "name": "John Doe",
            "nim": "23215008",
            "confidence": 98.5,
            "bounding_box": {"x": 120, "y": 80, "width": 200, "height": 200}
        }
    ],
    "message": "Wajah berhasil dikenali"
}

# POST /face/register
{
    "images": [
        "base64_image_1",
        "base64_image_2",
        "base64_image_3"
    ]
}

# Response
{
    "success": true,
    "message": "Wajah berhasil didaftarkan",
    "encodings_saved": 3
}
```

---

### **3. Attendance Routes** (`/api/v1/absensi`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/submit` | Submit attendance | Yes |
| GET | `/history` | Get attendance history | Yes |
| GET | `/today` | Check today's attendance | Yes |
| GET | `/statistics` | Get user statistics | Yes |
| GET | `/check-status` | Check if already submitted today | Yes |
| GET | `/admin/all` | Get all attendance records | Admin |
| GET | `/admin/statistics` | Get overall statistics | Admin |
| GET | `/admin/export` | Export data (CSV/Excel) | Admin |
| GET | `/admin/daily-report` | Daily attendance report | Admin |

**Request/Response Samples:**

```python
# POST /absensi/submit
{
    "image": "base64_encoded_image",
    "device_info": "Chrome 120.0 on Windows 10"
}

# Response
{
    "success": true,
    "message": "Absensi berhasil tercatat",
    "absensi": {
        "id": 45,
        "user_id": 1,
        "name": "John Doe",
        "nim": "23215008",
        "date": "2025-12-25",
        "timestamp": "2025-12-25T08:15:30",
        "status": "hadir",
        "confidence": 98.5
    },
    "is_duplicate": false
}

# GET /absensi/history?limit=10&offset=0
# Response
{
    "total": 45,
    "limit": 10,
    "offset": 0,
    "data": [
        {
            "id": 45,
            "date": "2025-12-25",
            "timestamp": "2025-12-25T08:15:30",
            "status": "hadir",
            "confidence": 98.5
        }
    ]
}
```

---

### **4. Admin Routes** (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/dashboard` | Dashboard overview data | Admin |
| GET | `/statistics` | System statistics | Admin |
| GET | `/students` | List all students | Admin |
| POST | `/students` | Create new student | Admin |
| POST | `/students/bulk` | Bulk import students | Admin |
| GET | `/students/dropdown` | Students list for dropdown | Admin |
| GET | `/students/without-face` | Students without face | Admin |
| GET | `/students/with-face` | Students with face | Admin |
| DELETE | `/students/{id}` | Delete student | Admin |
| GET | `/users` | List all users | Admin |
| POST | `/users` | Create user | Admin |
| GET | `/users/{id}` | Get user detail | Admin |
| PUT | `/users/{id}` | Update user | Admin |
| DELETE | `/users/{id}` | Delete user | Admin |
| POST | `/make-admin/{id}` | Promote to admin | Admin |
| POST | `/revoke-admin/{id}` | Revoke admin | Admin |
| GET | `/report` | Generate report | Admin |

---

### **5. Public Routes** (`/api/v1/public`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/scan-attendance` | Scan tanpa login (kiosk mode) | No |
| GET | `/history/{nim}` | Get history by NIM (public) | No |
| GET | `/check-status/{nim}` | Check status by NIM | No |
| GET | `/today-stats` | Today's statistics (public) | No |
| GET | `/latest-attendance` | Latest attendance list | No |

---

## 🔐 Security Implementation

### 1. **JWT Authentication**

```python
# Token Structure
{
    "access_token": {
        "sub": "user_id",
        "role": "user",
        "type": "access",
        "exp": 3600  # 1 hour
    },
    "refresh_token": {
        "sub": "user_id",
        "type": "refresh",
        "exp": 604800  # 7 days
    }
}
```

### 2. **Password Security**
- Hashing: bcrypt dengan cost factor 12
- Minimum 8 karakter
- Validasi: minimal 1 huruf, 1 angka

### 3. **Rate Limiting**
- Login: 5 attempts per 15 menit
- Face scan: 10 per menit per user
- API calls: 100 per menit per IP

### 4. **Data Encryption**
- Face encodings: Encrypted at rest
- Sensitive data: AES-256 encryption
- HTTPS only untuk production

### 5. **CORS Configuration**
```python
CORS_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://absensi.yourdomain.com"  # Production
]
```

---

## 🧠 Face Recognition Implementation

### Teknologi Pilihan: **DeepFace + OpenCV**

**Keunggulan:**
- ✅ Akurasi tinggi (99%+)
- ✅ Support multiple models (VGG-Face, Facenet, ArcFace)
- ✅ Built-in face detection
- ✅ Anti-spoofing capabilities

### Workflow:

```
1. Image Upload (Base64)
   ↓
2. Decode & Validation
   ↓
3. Face Detection (MTCNN/RetinaFace)
   ↓
4. Quality Check (blur, lighting, angle)
   ↓
5. Liveness Detection (eye blink, head movement)
   ↓
6. Face Encoding (512D vector)
   ↓
7. Comparison with Database (cosine similarity)
   ↓
8. Result (confidence score)
```

### Face Registration:
- Minimum 3 images dengan pose berbeda
- Quality threshold: > 85%
- Encoding storage: PostgreSQL (BYTEA) + Redis cache

### Face Recognition:
- Threshold confidence: 80%
- Real-time processing: < 2 detik
- Support multiple faces per image

---

## 🎭 Liveness Detection

### Metode 1: **Eye Blink Detection**
```python
# Using MediaPipe Face Mesh
- Detect eye landmarks
- Calculate Eye Aspect Ratio (EAR)
- Detect blink pattern (2 blinks dalam 3 detik)
- Threshold: EAR < 0.25
```

### Metode 2: **Head Movement**
```python
# Using face landmark tracking
- Detect pose changes (yaw, pitch, roll)
- Challenge: "Putar kepala ke kanan/kiri"
- Verify movement amplitude > 15 degrees
```

### Metode 3: **Challenge-Response**
```python
# Random challenges
- "Kedipkan mata 2x"
- "Senyum"
- "Gerakkan kepala ke kanan"
- Time limit: 5 detik
```

### Anti-Spoofing:
- ✅ Foto detection: Texture analysis
- ✅ Video replay: Temporal consistency check
- ✅ 3D mask: Depth estimation (jika webcam support)

---

## 📊 Performance & Scalability

### 1. **Caching Strategy (Redis)**
```python
# Cache user face encodings (HOT data)
KEY: "face:encoding:{user_id}"
TTL: 24 hours

# Cache daily attendance status
KEY: "attendance:today:{user_id}"
TTL: Until midnight

# Cache admin dashboard stats
KEY: "admin:stats:dashboard"
TTL: 5 minutes
```

### 2. **Database Optimization**
- Indexes pada kolom frequently queried
- Connection pooling: 20 connections
- Query optimization dengan SQLAlchemy lazy loading
- Partitioning untuk table `absensi` by date

### 3. **Background Jobs (Celery)**
```python
# Async tasks
- Email notifications (attendance confirmation)
- Daily report generation
- Data backup
- Face encoding updates
- Cleanup temporary files
```

### 4. **Image Processing**
```python
# Optimization
- Compress images: JPEG quality 85%
- Resize to max 1280x720
- Remove EXIF data
- Store thumbnails (200x200)
```

### 5. **Load Balancing**
```
nginx → [FastAPI Instance 1, FastAPI Instance 2, FastAPI Instance 3]
```

---

## 🧪 Testing Strategy

### 1. **Unit Tests**
```python
# Coverage target: 80%
- Services layer
- Repositories
- Utilities
- Authentication
```

### 2. **Integration Tests**
```python
- API endpoints (pytest + httpx)
- Database operations
- Face recognition pipeline
- Authentication flow
```

### 3. **Performance Tests**
```python
# Load testing dengan Locust
- 100 concurrent users
- Face scan: < 2s response time
- API calls: < 500ms
- Database queries: < 100ms
```

---

## 🚀 Deployment Strategy

### Development
```bash
# Docker Compose
services:
  - backend (FastAPI)
  - postgres
  - redis
  - celery-worker
```

### Production
```bash
# Docker + Kubernetes
- Auto-scaling: 2-10 pods
- Health checks
- Rolling updates
- Monitoring: Prometheus + Grafana
```

### CI/CD Pipeline
```yaml
1. Code push → GitHub
2. Run tests (pytest)
3. Build Docker image
4. Push to registry
5. Deploy to staging
6. Manual approval
7. Deploy to production
```

---

## 📦 Dependencies (requirements.txt)

```txt
# Core
fastapi==0.108.0
uvicorn[standard]==0.25.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.13.1

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Face Recognition
opencv-python==4.8.1.78
deepface==0.0.79
mediapipe==0.10.8
numpy==1.24.3
Pillow==10.1.0

# Caching & Background Jobs
redis==5.0.1
celery==5.3.4

# Utilities
pydantic==2.5.2
pydantic-settings==2.1.0
python-dotenv==1.0.0
pytz==2023.3
python-dateutil==2.8.2

# Export
openpyxl==3.1.2
pandas==2.1.3

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
faker==20.1.0

# Monitoring
prometheus-client==0.19.0
```

---

## 🔧 Environment Variables (.env)

```env
# Application
APP_NAME="Smart Absensi API"
APP_VERSION="1.0.0"
DEBUG=False
SECRET_KEY="your-super-secret-key-change-in-production"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/absensi_db"
DB_ECHO=False

# Redis
REDIS_URL="redis://localhost:6379/0"

# JWT
JWT_SECRET_KEY="your-jwt-secret-key"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# File Storage
STORAGE_PATH="./storage"
MAX_UPLOAD_SIZE_MB=10

# Face Recognition
FACE_RECOGNITION_MODEL="VGG-Face"  # VGG-Face, Facenet, ArcFace
FACE_CONFIDENCE_THRESHOLD=0.80
LIVENESS_ENABLED=True

# Email (optional)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="9ebfb8001@smtp-brevo.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@absensi.ac.id"

# Celery
CELERY_BROKER_URL="redis://localhost:6379/0"
CELERY_RESULT_BACKEND="redis://localhost:6379/0"

# Monitoring
PROMETHEUS_PORT=9090
```

---

## 📈 Monitoring & Logging

### 1. **Application Logs**
```python
# Structured logging dengan loguru
import loguru

logger.add(
    "logs/app_{time}.log",
    rotation="500 MB",
    retention="30 days",
    level="INFO"
)
```

### 2. **Metrics (Prometheus)**
```python
# Track metrics
- Request count & latency
- Face recognition success rate
- Database query time
- Cache hit/miss ratio
- Active users
```

### 3. **Error Tracking**
```python
# Sentry integration
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=0.1
)
```

---

## 🎯 Implementation Roadmap

### **Phase 1: Core Setup (Week 1-2)**
- [x] Setup project structure
- [ ] Database schema & migrations
- [ ] Authentication (JWT)
- [ ] Basic CRUD operations
- [ ] Docker development environment

### **Phase 2: Face Recognition (Week 3-4)**
- [ ] Face detection integration
- [ ] Face encoding & storage
- [ ] Face recognition algorithm
- [ ] Liveness detection (basic)
- [ ] Testing & optimization

### **Phase 3: Attendance System (Week 5)**
- [ ] Attendance submission logic
- [ ] Duplicate prevention
- [ ] Status management (hadir/terlambat)
- [ ] History & statistics

### **Phase 4: Admin Features (Week 6)**
- [ ] Dashboard data aggregation
- [ ] User management
- [ ] Report generation
- [ ] Export functionality (CSV/Excel)

### **Phase 5: Optimization (Week 7)**
- [ ] Redis caching
- [ ] Background jobs (Celery)
- [ ] Performance tuning
- [ ] Load testing

### **Phase 6: Production Ready (Week 8)**
- [ ] Security hardening
- [ ] Monitoring & logging
- [ ] Documentation (API docs)
- [ ] Deployment scripts
- [ ] CI/CD pipeline

---

## 🎨 Best Practices

### Code Quality
- ✅ PEP 8 compliance
- ✅ Type hints (mypy)
- ✅ Docstrings
- ✅ Code reviews

### Security
- ✅ Input validation (Pydantic)
- ✅ SQL injection prevention (ORM)
- ✅ XSS protection
- ✅ Rate limiting
- ✅ Audit logging

### Performance
- ✅ Async operations (asyncio)
- ✅ Database connection pooling
- ✅ Caching strategy
- ✅ Image optimization
- ✅ Query optimization

---

## 📚 Additional Resources

### Documentation
- FastAPI: https://fastapi.tiangolo.com/
- DeepFace: https://github.com/serengil/deepface
- SQLAlchemy: https://www.sqlalchemy.org/
- Celery: https://docs.celeryq.dev/

### Learning Resources
- Face Recognition: https://pypi.org/project/face-recognition/
- MediaPipe: https://google.github.io/mediapipe/
- JWT: https://jwt.io/

---

## 🤝 Support & Maintenance

### Monitoring Checklist
- [ ] Daily backup database
- [ ] Check error logs
- [ ] Monitor disk space (face images)
- [ ] Review performance metrics
- [ ] Update dependencies

### Maintenance Schedule
- **Weekly:** Review logs, check performance
- **Monthly:** Database optimization, security audit
- **Quarterly:** Dependency updates, feature review

---

## 📝 Notes

### Known Limitations
1. Face recognition accuracy menurun di kondisi:
   - Pencahayaan sangat rendah
   - Wajah tertutup masker > 50%
   - Jarak > 2 meter dari kamera

2. Performance considerations:
   - Max 1000 registered faces untuk response time < 2s
   - Perlu GPU untuk > 5000 users

### Future Enhancements
- [ ] Mobile app support (React Native)
- [ ] QR code backup attendance
- [ ] GPS location verification
- [ ] WhatsApp notification integration
- [ ] Multi-camera support (CCTV)
- [ ] Facial emotion detection
- [ ] Mask detection

---

## ✅ Conclusion

Backend ini dirancang untuk:
1. **Scalability** - Support hingga 10,000 users
2. **Security** - Enterprise-grade security practices
3. **Performance** - Response time < 2 detik
4. **Maintainability** - Clean architecture & documentation
5. **Reliability** - 99.9% uptime target

**Teknologi stack yang dipilih sudah production-proven dan well-documented**, memudahkan development dan maintenance jangka panjang.

---

**Dibuat oleh:** GitHub Copilot (Luna)  
**Tanggal:** 25 Desember 2025  
**Versi:** 1.0
