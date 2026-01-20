# Changelog

All notable changes to **FahrenCenter - Smart Attendance System** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- [ ] Email notifications untuk absensi
- [ ] Export attendance report ke PDF
- [ ] Multi-language support (ID/EN)
- [ ] Mobile app (React Native)

---

## [1.0.0] - 2026-01-12

### 🎉 Initial Release - Production Ready

**FahrenCenter Smart Attendance System** - Sistem absensi sekolah berbasis face recognition dengan liveness detection.

---

### Added - Backend

#### Core Features
- ✅ **Authentication System**
  - JWT-based authentication (access + refresh tokens)
  - Password hashing dengan bcrypt
  - Role-based access control (user, admin)
  - Session management
  - Auto token refresh mechanism

- ✅ **Face Recognition**
  - Face detection menggunakan HOG (Histogram of Oriented Gradients)
  - Face encoding dengan dlib FaceNet (128D vectors)
  - Face matching dengan Euclidean distance (L2)
  - Confidence threshold: 0.55 (adjustable)
  - Quality checks (blur, brightness, face size)
  - Multi-encoding support (3-5 photos per user)

- ✅ **Attendance Management**
  - Attendance submission dengan face verification
  - Duplicate prevention (1x per day)
  - Attendance history dengan pagination
  - Statistics (attendance rate, streak)
  - Date-range filtering

- ✅ **Admin Portal**
  - Dashboard dengan statistics & charts
  - Student/Teacher management (CRUD)
  - Bulk import students
  - Attendance reports (JSON/CSV)
  - System settings management

#### Database
- ✅ SQLite database (production-ready untuk < 200 users)
- ✅ 5 tables: users, face_encodings, absensi, refresh_tokens, audit_logs
- ✅ SQLAlchemy ORM models
- ✅ Database initialization script
- ✅ Default admin user seeding

#### API Endpoints (27 Total)
- ✅ **Auth API** (6 endpoints): register, login, refresh, me, change-password, logout
- ✅ **Face API** (6 endpoints): scan, register, status, unregister, admin-register, admin-unregister
- ✅ **Attendance API** (4 endpoints): submit, history, today, statistics
- ✅ **Admin API** (9 endpoints): dashboard, students (CRUD), bulk-create, report, date-statistics
- ✅ **Public API** (2 endpoints): today-stats, latest-attendance

#### Documentation
- ✅ Interactive API docs (Swagger UI)
- ✅ Alternative docs (ReDoc)
- ✅ Comprehensive README.md
- ✅ Setup guide (README_SETUP.md)
- ✅ Architecture documentation

---

### Added - Frontend

#### Core Features
- ✅ **Modern UI/UX**
  - TailwindCSS 3.4+ styling
  - Framer Motion animations
  - Lucide React icons
  - Responsive design (mobile-first)
  - Dark mode support

- ✅ **Face Recognition Interface**
  - Face registration page (upload/capture 3-5 photos)
  - Real-time quality checks (blur, lighting, size)
  - Face encoding progress indicator
  - Preview before submit
  - Delete & re-capture functionality

- ✅ **Liveness Detection**
  - Blink detection menggunakan Eye Aspect Ratio (EAR)
  - MediaPipe Face Mesh integration
  - Head movement tracking
  - Real-time visual feedback
  - Pass/fail indicator

- ✅ **Attendance System**
  - Public attendance (no login required)
  - Student attendance portal
  - Teacher kiosk mode
  - Face recognition dengan confidence display
  - Voice notification (Web Speech API)
  - Duplicate check & prevention

- ✅ **Admin Dashboard**
  - Statistics overview (students, teachers, attendance)
  - Attendance rate charts (Recharts)
  - Recent attendance list
  - Student/Teacher management
  - Search, filter, pagination
  - Bulk operations

#### Architecture
- ✅ React 19 + TypeScript 5.9
- ✅ Vite 7 build tool
- ✅ Zustand 5 state management
- ✅ TanStack React Query 5 (server state)
- ✅ React Router DOM 7 (routing)
- ✅ React Hook Form 7 + Zod 4 (forms & validation)
- ✅ Axios dengan interceptors (auto refresh token)

#### Developer Experience
- ✅ TypeScript strict mode
- ✅ ESLint configuration
- ✅ Organized folder structure
- ✅ Reusable components (ui/, features/, layouts/)
- ✅ Service layer (API abstraction)
- ✅ Custom hooks (useAuth, useFaceDetection, useVoice)

---

### Added - Documentation

#### Guides
- ✅ **AUTHENTICATION_GUIDE.md** - JWT authentication flow & troubleshooting
- ✅ **FACE_REGISTRATION_GUIDE.md** - Face registration step-by-step
- ✅ **GIT_COMMIT_TEMPLATE.md** - Commit message conventions
- ✅ **TROUBLESHOOTING.md** - Common issues & solutions

#### Project Documentation
- ✅ **CONTRIBUTING.md** - Contribution guidelines
- ✅ **CHANGELOG.md** - Version history (this file)
- ✅ **README.md** (Root) - Project overview
- ✅ **backend/README.md** - Backend API documentation
- ✅ **frontend/README.md** - Frontend setup & architecture

#### Reports (docs/reports/)
- ✅ Backend core implementation report
- ✅ Backend completion report (100%)
- ✅ Frontend integration report
- ✅ Authentication security fix report
- ✅ Face recognition upgrade report
- ✅ Liveness detection implementation report
- ✅ Admin dashboard completion report
- ✅ Project completion summary

#### Plans (docs/plans/)
- ✅ Backend architecture plan
- ✅ Frontend schema update plan
- ✅ Face recognition upgrade plan
- ✅ Admin dashboard design plan
- ✅ Critical fixes plan (webcam, dropdown, liveness)
- ✅ Future improvements roadmap

---

### Security

#### Implemented
- ✅ JWT authentication dengan access & refresh tokens
- ✅ Password hashing dengan bcrypt (cost factor: 12)
- ✅ CORS configuration
- ✅ Input validation (Pydantic schemas)
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS prevention (React default escaping)
- ✅ Secure token storage (HTTP-only cookies optional)
- ✅ Rate limiting ready (FastAPI middleware)

#### Best Practices
- ✅ Environment variables untuk secrets
- ✅ .gitignore untuk sensitive files
- ✅ Separation of concerns (security.py)
- ✅ Audit logging (audit_logs table)

---

### Performance

#### Optimizations
- ✅ **Face Recognition**
  - HOG model (CPU-friendly, ~50ms per detection)
  - Image resizing before processing (800px max)
  - Lazy loading face encodings
  - Caching dengan React Query

- ✅ **Frontend**
  - Code splitting (React Router lazy)
  - Image optimization (WebP support)
  - MediaPipe models cached di public/
  - Skeleton loaders untuk UX

- ✅ **Database**
  - SQLite WAL mode (Write-Ahead Logging)
  - Indexed columns (nim, email, user_id)
  - Pagination untuk large datasets

- ✅ **API**
  - Gzip compression
  - Response caching headers
  - Efficient queries (eager loading)

---

### Quality Assurance

#### Code Quality
- ✅ TypeScript strict mode (no `any`)
- ✅ Python type hints
- ✅ ESLint configuration
- ✅ Black formatter (Python)
- ✅ Consistent naming conventions
- ✅ Modular architecture
- ✅ Separation of concerns

#### Testing
- ✅ Backend: Unit tests ready (pytest)
- ✅ Frontend: Manual testing completed
- ✅ Authentication flow tested
- ✅ Face registration tested
- ✅ Liveness detection tested
- ✅ Attendance submission tested
- ✅ Admin dashboard tested

---

### Known Issues

#### Current Limitations
- ⚠️ SQLite concurrent write limitations (max ~50 concurrent users)
  - **Solution:** Migrate ke PostgreSQL untuk scaling
  
- ⚠️ Face recognition accuracy ~90-95% (lighting-dependent)
  - **Mitigation:** Quality checks implemented
  
- ⚠️ HTTPS required untuk webcam di production
  - **Solution:** SSL setup guide di DEPLOYMENT.md
  
- ⚠️ MediaPipe models ~10MB (initial load)
  - **Mitigation:** Models cached setelah first load

#### Workarounds Documented
- ✅ dlib installation issues (Windows) → Pre-built wheels
- ✅ Database locked error → WAL mode
- ✅ Webcam permission → HTTPS requirement documented
- ✅ CORS issues → Configuration guide

---

### Deployment

#### Supported Platforms
- ✅ Windows (development)
- ✅ Linux (production recommended)
- ✅ Docker (optional, Dockerfile ready)
- ✅ Cloud (AWS, GCP, Azure compatible)

#### Requirements
**Backend:**
- Python 3.10+
- 2GB RAM (minimum)
- 2 CPU cores (minimum)
- 10GB storage

**Frontend:**
- Node.js 18+ atau 20+
- Static hosting (Vercel, Netlify, Nginx)

---

### Academic Context

#### Project Details
- **Institution:** Universitas Harkat Negeri
- **Course:** Pengolahan Citra Digital (PCD)
- **Semester:** 5 (2025/2026)
- **Project Type:** UAS (Final Examination)

#### Learning Outcomes
- ✅ Face recognition algorithms (HOG, FaceNet)
- ✅ Computer vision techniques (OpenCV, MediaPipe)
- ✅ Backend API development (FastAPI)
- ✅ Frontend development (React, TypeScript)
- ✅ Full-stack integration
- ✅ Production-ready system architecture

---

## [0.9.0] - 2026-01-08

### Development Phase

#### Major Milestones
- ✅ Backend core implementation (60% → 100%)
- ✅ Face recognition service completed
- ✅ Attendance service completed
- ✅ Admin API completed
- ✅ Frontend-backend integration
- ✅ Authentication modernization
- ✅ Liveness detection implementation
- ✅ Admin dashboard redesign

---

## [0.5.0] - 2025-12-25

### Planning Phase

#### Completed
- ✅ Backend architecture planning
- ✅ Database schema design
- ✅ API endpoint design
- ✅ Frontend structure planning
- ✅ Face recognition specification

---

## Version History Summary

| Version | Date       | Status            | Description                          |
|---------|------------|-------------------|--------------------------------------|
| 1.0.0   | 2026-01-12 | ✅ Stable         | Production-ready release             |
| 0.9.0   | 2026-01-08 | 🚧 Development    | Development phase completed          |
| 0.5.0   | 2025-12-25 | 📋 Planning       | Architecture & planning phase        |

---

## Migration Guides

### Upgrading from Development to 1.0.0

#### Backend Changes
```bash
# 1. Update environment variables
cp .env.example .env
# Edit SECRET_KEY dan JWT_SECRET_KEY

# 2. Update dependencies
pip install -r requirements.txt

# 3. Reinitialize database (if needed)
python -m app.db.init_db
```

#### Frontend Changes
```bash
# 1. Update dependencies
npm install

# 2. Download MediaPipe models
npm run download-models

# 3. Update .env
# VITE_API_BASE_URL=http://localhost:8001/api/v1
```

#### No Breaking Changes
- All existing endpoints backward compatible
- Database schema unchanged
- Authentication flow unchanged

---

## Future Roadmap

### v1.1.0 (Planned - Q1 2026)
- [ ] Email notifications
- [ ] Export report ke PDF
- [ ] Advanced analytics dashboard
- [ ] Bulk attendance import
- [ ] Facial landmark analysis improvements

### v1.2.0 (Planned - Q2 2026)
- [ ] Multi-language support (ID/EN)
- [ ] PostgreSQL migration guide
- [ ] Redis caching layer
- [ ] Attendance scheduling (shift, weekend)
- [ ] Parent portal

### v2.0.0 (Planned - Q3 2026)
- [ ] Mobile app (React Native)
- [ ] Microservices architecture
- [ ] Real-time notifications (WebSocket)
- [ ] Machine learning face recognition upgrade
- [ ] Multi-school support

---

## Contributors

**Development Team:**
- Backend Architecture & Implementation
- Frontend Development & UI/UX
- Face Recognition Integration
- System Integration & Testing
- Documentation & Guides

**Special Thanks:**
- Universitas Harkat Negeri (Academic Support)
- GitHub Copilot (Development Assistant)
- Open Source Community (Libraries & Tools)

---

## License

This project is developed for educational purposes as part of **Pengolahan Citra Digital (PCD)** course at **Universitas Harkat Negeri**.

For commercial use or redistribution, please contact the project maintainers.

---

**Dibuat dengan � oleh Lycus (Affif)**  
**FahrenCenter** - *"Attendance Made Smart"*  
**Version:** 1.0.0  
**Last Updated:** January 20, 2026