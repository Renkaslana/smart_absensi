# 📋 FahrenCenter - Future Improvements & Roadmap

**Tanggal**: 8 Januari 2026  
**Author**: Luna 🌙  
**Status**: Planning Phase  
**Priority**: Post-MVP Enhancements

---

## 🎯 Executive Summary

Dokumen ini berisi rencana pengembangan dan peningkatan sistem FahrenCenter Smart Attendance setelah MVP (Minimum Viable Product) selesai. Focus pada improvement yang akan meningkatkan performa, keamanan, user experience, dan maintainability.

---

## ✅ Current Status (What We Have)

### Frontend (100% Complete)
- ✅ Student Portal (5 pages)
- ✅ Teacher Portal (5 pages)
- ✅ Admin Portal (existing)
- ✅ Public Attendance Kiosk
- ✅ Modern UI with Tailwind CSS
- ✅ Framer Motion animations
- ✅ TypeScript type safety
- ✅ Service layer for API calls

### Backend (Existing)
- ✅ FastAPI framework
- ✅ Face recognition with dlib
- ✅ JWT authentication
- ✅ SQLite database
- ✅ RESTful API structure

### Gaps (Need Improvement)
- ⚠️ No React Query integration (still using dummy data)
- ⚠️ No real camera integration for face features
- ⚠️ No liveness detection implementation
- ⚠️ No backend endpoints for student/teacher portals
- ⚠️ No unit tests
- ⚠️ No E2E tests
- ⚠️ No CI/CD pipeline
- ⚠️ No production deployment setup

---

## 🚀 Phase 1: Backend API Completion (Priority: CRITICAL)

**Timeline**: 1-2 weeks  
**Difficulty**: Medium  
**Impact**: High - Blocks frontend functionality

### Tasks:

#### 1.1 Student API Endpoints
**File**: `backend/app/api/v1/endpoints/students.py` (new)

```python
GET    /api/v1/students/dashboard/summary      # Dashboard stats
GET    /api/v1/students/schedule               # Weekly schedule
GET    /api/v1/students/attendance/history     # Attendance history
GET    /api/v1/students/attendance/export      # Export CSV
GET    /api/v1/students/face/status            # Face reg status
POST   /api/v1/students/face/register          # Upload photo
DELETE /api/v1/students/face/photos/:id        # Delete photo
GET    /api/v1/students/profile                # Get profile
PUT    /api/v1/students/profile                # Update profile
POST   /api/v1/students/password/change        # Change password
POST   /api/v1/students/attendance/mark        # Self-attendance
```

**Dependencies**:
- SQLAlchemy models: `Student`, `Absensi`, `Schedule`, `FaceEncoding`
- Authentication middleware
- File upload handling (multipart/form-data)

#### 1.2 Teacher API Endpoints
**File**: `backend/app/api/v1/endpoints/teachers.py` (new)

```python
GET  /api/v1/teachers/dashboard/summary        # Dashboard stats
GET  /api/v1/teachers/classes/today            # Today's classes
GET  /api/v1/teachers/activity/recent          # Recent activity
GET  /api/v1/teachers/classes                  # All classes
GET  /api/v1/teachers/classes/:id              # Class details
GET  /api/v1/teachers/classes/:id/students     # Students for attendance
POST /api/v1/teachers/attendance/mark          # Mark attendance
POST /api/v1/teachers/attendance/bulk-scan     # Face scan multiple
GET  /api/v1/teachers/reports/generate         # Generate report
GET  /api/v1/teachers/reports/top-students     # Best attendance
GET  /api/v1/teachers/reports/low-attendance   # Need attention
GET  /api/v1/teachers/reports/export/pdf       # Export PDF
GET  /api/v1/teachers/reports/export/excel     # Export Excel
GET  /api/v1/teachers/reports/export/csv       # Export CSV
GET  /api/v1/teachers/profile                  # Get profile
PUT  /api/v1/teachers/profile                  # Update profile
POST /api/v1/teachers/password/change          # Change password
```

**Dependencies**:
- Report generation library (ReportLab for PDF, openpyxl for Excel)
- Aggregation queries (attendance statistics)
- Teacher-student-class relationship queries

#### 1.3 Public API Endpoints
**File**: `backend/app/api/v1/endpoints/public.py` (new)

```python
POST /api/v1/public/attendance/mark            # Kiosk face recognition
GET  /api/v1/public/kiosk/info                 # Current session info
POST /api/v1/public/face/check                 # Check if registered
```

**Dependencies**:
- Public endpoint (no auth required)
- Rate limiting (prevent abuse)
- Image processing pipeline

#### 1.4 Database Schema Updates
**File**: `backend/app/models/` (update existing)

**New fields needed**:
- `users` table: `phone`, `address`, `birth_date`, `tahun_masuk`, `wali_kelas`
- `teachers` table: `mata_pelajaran`, `pendidikan`, `tahun_bergabung`
- `classes` table: `ruangan`, `total_siswa`
- `schedules` table: New table for weekly schedule
- `audit_logs` table: Track all actions

**Relationships**:
- Teacher → Classes (one-to-many)
- Student → Class (many-to-one)
- Class → Schedules (one-to-many)

---

## 🎥 Phase 2: Real Face Recognition Integration (Priority: HIGH)

**Timeline**: 1 week  
**Difficulty**: Medium  
**Impact**: High - Core feature

### 2.1 Liveness Detection Implementation

**Location**: `backend/app/services/liveness_detection.py` (new)

**Features**:
- Blink detection (Eye Aspect Ratio - EAR)
- Head movement detection (pose estimation)
- Random action prompts (smile, nod, turn head)
- Texture analysis (detect printed photos/screens)

**Algorithm**:
```python
class LivenessDetector:
    def check_liveness(self, video_frames: List[np.ndarray]) -> bool:
        # 1. Check blink (EAR analysis)
        blink_count = self.detect_blinks(video_frames)
        if blink_count < 2:
            return False
        
        # 2. Check head movement
        pose_variation = self.analyze_head_pose(video_frames)
        if pose_variation < threshold:
            return False
        
        # 3. Texture analysis (anti-spoofing)
        texture_score = self.analyze_texture(video_frames[-1])
        if texture_score < threshold:
            return False
        
        return True
```

**Frontend Integration**:
- Update `RegisterFacePage.tsx` to capture video stream
- Implement real-time liveness feedback
- Show instructions to user (blink, turn head)

### 2.2 Face Quality Validation

**Location**: `backend/app/services/face_quality.py` (update)

**Enhancements**:
- Blur detection (Laplacian variance)
- Brightness check (mean pixel intensity)
- Face size validation (minimum 80x80px)
- Pose angle check (frontal face only, ±30°)
- Occlusion detection (glasses, mask, hat)

**Rejection Criteria**:
```python
def validate_face_quality(image: np.ndarray) -> Tuple[bool, str]:
    # Blur check
    if laplacian_variance < 100:
        return False, "Image too blurry"
    
    # Brightness check
    if mean_brightness < 50 or mean_brightness > 220:
        return False, "Poor lighting"
    
    # Face size
    if face_width < 80 or face_height < 80:
        return False, "Face too small"
    
    # Pose angle
    if abs(yaw) > 30 or abs(pitch) > 30:
        return False, "Face not frontal"
    
    return True, "OK"
```

### 2.3 Real Camera Integration

**Frontend Files to Update**:
1. `frontend/src/pages/student/RegisterFacePage.tsx`
2. `frontend/src/pages/teacher/MarkAttendancePage.tsx` (face scan mode)
3. `frontend/src/pages/public/PublicAttendancePage.tsx`

**Implementation**:
```typescript
// Camera hook
const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      setStream(mediaStream);
    } catch (err) {
      setError('Camera access denied');
    }
  };
  
  const captureFrame = () => {
    // Capture from video element
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  };
  
  return { stream, error, startCamera, captureFrame };
};
```

---

## 🔄 Phase 3: React Query Integration (Priority: HIGH)

**Timeline**: 3-4 days  
**Difficulty**: Low-Medium  
**Impact**: High - Better UX, caching, error handling

### 3.1 Setup React Query

**File**: `frontend/src/main.tsx` (update)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### 3.2 Create Custom Hooks

**File**: `frontend/src/hooks/useStudentData.ts` (new)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import studentService from '../services/studentService';

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ['student', 'dashboard'],
    queryFn: studentService.getStudentDashboardSummary,
  });
};

export const useAttendanceHistory = (filters: any) => {
  return useQuery({
    queryKey: ['student', 'attendance', 'history', filters],
    queryFn: () => studentService.getAttendanceHistory(filters),
    keepPreviousData: true,
  });
};

export const useRegisterFace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: studentService.registerFacePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries(['student', 'face', 'status']);
      toast.success('Photo berhasil ditambahkan!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal upload photo');
    },
  });
};
```

### 3.3 Update Pages to Use Hooks

**Example**: `frontend/src/pages/student/Dashboard.tsx`

**Before** (dummy data):
```typescript
const [stats, setStats] = useState({ ... });
```

**After** (real data):
```typescript
const { data: stats, isLoading, error } = useStudentDashboard();

if (isLoading) return <SkeletonLoader />;
if (error) return <ErrorMessage error={error} />;

// Use real data
<p className="text-3xl font-bold">{stats.persentase_kehadiran}%</p>
```

---

## 🧪 Phase 4: Testing Infrastructure (Priority: MEDIUM)

**Timeline**: 1-2 weeks  
**Difficulty**: Medium  
**Impact**: Medium - Quality assurance

### 4.1 Backend Unit Tests

**Framework**: pytest  
**File**: `backend/tests/` (new directory)

**Test Coverage**:
- `test_auth.py`: Login, refresh token, logout
- `test_face_recognition.py`: Face detection, encoding, matching
- `test_students.py`: Student CRUD, attendance marking
- `test_teachers.py`: Teacher CRUD, class management
- `test_reports.py`: Report generation, exports

**Example**:
```python
def test_face_recognition_success():
    # Given: A registered face
    face_encoding = register_face(test_image)
    
    # When: Matching with same person
    result = recognize_face(test_image_2, face_encoding)
    
    # Then: Should match with high confidence
    assert result.matched == True
    assert result.confidence > 0.8
```

### 4.2 Frontend Unit Tests

**Framework**: Vitest + React Testing Library  
**File**: `frontend/src/__tests__/` (new)

**Test Coverage**:
- `components/Card.test.tsx`: Component rendering
- `hooks/useAuth.test.ts`: Auth hook logic
- `services/api.test.ts`: API interceptors
- `pages/Dashboard.test.tsx`: Page integration

### 4.3 E2E Tests

**Framework**: Playwright  
**File**: `e2e/` (new directory)

**Test Scenarios**:
- Student login → Dashboard → Face registration → Logout
- Teacher login → Mark attendance → Generate report → Logout
- Admin login → Add student → Register face → Check attendance
- Public kiosk → Face scan → Success/failure flow

---

## 🔒 Phase 5: Security Enhancements (Priority: HIGH)

**Timeline**: 1 week  
**Difficulty**: Medium  
**Impact**: Critical - Production readiness

### 5.1 Rate Limiting

**Backend**: Use `slowapi` (Flask-Limiter equivalent for FastAPI)

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")  # Max 5 login attempts per minute
async def login(credentials: LoginData):
    ...
```

### 5.2 Input Validation & Sanitization

**Backend**: Strengthen Pydantic schemas

```python
class UpdateProfileData(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, regex=r'^\+?[0-9]{10,15}$')
    
    @validator('name')
    def sanitize_name(cls, v):
        return re.sub(r'[<>{}]', '', v)  # Remove HTML characters
```

### 5.3 HTTPS & CORS Hardening

**Backend**: `backend/.env`

```bash
# Production settings
DEBUG=False
CORS_ORIGINS=["https://fahrencenter.school.id"]
ALLOWED_HOSTS=["api.fahrencenter.school.id"]
SECURE_COOKIES=True
HTTPS_ONLY=True
```

### 5.4 Face Data Encryption

**Backend**: Encrypt face encodings in database

```python
from cryptography.fernet import Fernet

class FaceEncryption:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)
    
    def encrypt_encoding(self, encoding: np.ndarray) -> bytes:
        encoding_bytes = encoding.tobytes()
        return self.cipher.encrypt(encoding_bytes)
    
    def decrypt_encoding(self, encrypted: bytes) -> np.ndarray:
        decrypted = self.cipher.decrypt(encrypted)
        return np.frombuffer(decrypted, dtype=np.float64)
```

---

## 📊 Phase 6: Analytics & Monitoring (Priority: LOW)

**Timeline**: 1 week  
**Difficulty**: Medium  
**Impact**: Low - Optional enhancement

### 6.1 Admin Analytics Dashboard

**Features**:
- Real-time attendance rate trends
- Class-wise performance comparison
- Student attendance heatmap (calendar view)
- Face recognition accuracy metrics
- System usage statistics

**Charts**: Use Recharts (already in stack)

### 6.2 Backend Logging

**Framework**: Python `logging` + `loguru`

```python
from loguru import logger

logger.add(
    "logs/attendance_{time}.log",
    rotation="1 day",
    retention="30 days",
    compression="zip"
)

@app.post("/api/v1/students/attendance/mark")
async def mark_attendance(data: AttendanceData, user: User):
    logger.info(f"Attendance marked: user={user.id}, method={data.method}")
    ...
```

### 6.3 Error Tracking

**Service**: Sentry.io

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="https://...@sentry.io/...",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

---

## 🚀 Phase 7: Deployment & DevOps (Priority: MEDIUM)

**Timeline**: 1 week  
**Difficulty**: Medium-High  
**Impact**: High - Production deployment

### 7.1 Docker Containerization

**File**: `docker-compose.yml` (new)

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/absensi
    depends_on:
      - db
    volumes:
      - ./backend/uploads:/app/uploads
  
  frontend:
    build: ./frontend
    ports:
      - "3001:3001"
    depends_on:
      - backend
  
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: absensi
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 7.2 CI/CD Pipeline

**Platform**: GitHub Actions  
**File**: `.github/workflows/ci.yml` (new)

```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to server
        run: |
          # SSH deploy script
          ssh user@server 'cd /var/www && git pull && docker-compose up -d'
```

### 7.3 Database Migration

**Framework**: Alembic

```bash
# Generate migration
alembic revision --autogenerate -m "add teacher fields"

# Run migration
alembic upgrade head
```

---

## 📱 Phase 8: Mobile App (Priority: LOW)

**Timeline**: 4-6 weeks  
**Difficulty**: High  
**Impact**: Low - Optional expansion

### 8.1 Technology Stack

**Framework**: React Native (code reuse from web)  
**Features**:
- Student app: Dashboard, attendance history, face registration
- Teacher app: Mark attendance, view reports
- Push notifications for attendance reminders

### 8.2 API Adjustments

**Backend**: Add mobile-specific endpoints

```python
GET  /api/v1/mobile/notifications     # Push notifications
POST /api/v1/mobile/fcm-token        # Register device
GET  /api/v1/mobile/app-version      # Force update check
```

---

## 🎨 Phase 9: UI/UX Enhancements (Priority: LOW)

**Timeline**: 1 week  
**Difficulty**: Low  
**Impact**: Low - Polish

### Features:
- Dark mode toggle
- Accessibility improvements (ARIA labels, keyboard nav)
- Skeleton loaders (already partially done)
- Internationalization (i18n) - English + Indonesian
- Offline mode (PWA with service workers)
- Export reports as PDF with charts/graphs

---

## 📋 Priority Matrix

| Phase | Priority | Difficulty | Timeline | Blocks MVP |
|-------|----------|-----------|----------|-----------|
| Phase 1: Backend API | 🔴 CRITICAL | Medium | 1-2 weeks | YES |
| Phase 2: Face Recognition | 🔴 HIGH | Medium | 1 week | YES |
| Phase 3: React Query | 🔴 HIGH | Low-Med | 3-4 days | NO |
| Phase 4: Testing | 🟡 MEDIUM | Medium | 1-2 weeks | NO |
| Phase 5: Security | 🔴 HIGH | Medium | 1 week | PROD ONLY |
| Phase 6: Analytics | 🟢 LOW | Medium | 1 week | NO |
| Phase 7: Deployment | 🟡 MEDIUM | Med-High | 1 week | PROD ONLY |
| Phase 8: Mobile App | 🟢 LOW | High | 4-6 weeks | NO |
| Phase 9: UI Polish | 🟢 LOW | Low | 1 week | NO |

---

## 🎯 Recommended Roadmap

### Sprint 1 (Week 1-2): Core Functionality
- ✅ Phase 1: Backend API endpoints (students + teachers)
- ✅ Phase 2.3: Real camera integration

### Sprint 2 (Week 3): Face Recognition
- ✅ Phase 2.1: Liveness detection
- ✅ Phase 2.2: Quality validation
- ✅ Phase 3: React Query integration

### Sprint 3 (Week 4): Production Prep
- ✅ Phase 5: Security hardening
- ✅ Phase 4.1: Backend unit tests
- ✅ Phase 7.1: Docker setup

### Sprint 4 (Week 5): Polish & Deploy
- ✅ Phase 4.2-4.3: Frontend & E2E tests
- ✅ Phase 7.2-7.3: CI/CD + migration
- ✅ Production deployment

### Post-MVP (Optional):
- Phase 6: Analytics dashboard
- Phase 8: Mobile app
- Phase 9: UI/UX polish

---

## 🚀 Next Immediate Steps

1. **Backend API Development** (Week 1)
   - Create student endpoints
   - Create teacher endpoints
   - Create public endpoints
   - Update database schema

2. **Test Backend APIs** (Week 1)
   - Use Postman/Thunder Client
   - Verify all endpoints work
   - Check authentication flow

3. **Frontend Integration** (Week 2)
   - Replace dummy data with React Query hooks
   - Test all pages with real API
   - Handle loading/error states

4. **Face Recognition** (Week 2-3)
   - Implement liveness detection
   - Integrate camera in all pages
   - Test accuracy & performance

5. **Production Prep** (Week 4)
   - Security hardening
   - Docker containerization
   - Write tests
   - Deploy to staging

---

## 📞 Support & Maintenance

### Post-Launch Tasks:
- Monitor error logs (Sentry)
- Check face recognition accuracy metrics
- Gather user feedback
- Fix bugs (priority based on severity)
- Performance optimization (query tuning, caching)

### Documentation:
- API documentation (Swagger/OpenAPI)
- User manual (student, teacher, admin)
- Developer guide (setup, contribution)
- Deployment guide (production setup)

---

**Document End**  
**Last Updated**: 8 Januari 2026  
**Next Review**: After Phase 1 completion
