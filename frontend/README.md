# FahrenCenter Frontend - Smart Attendance System

Frontend aplikasi sistem absensi berbasis **face recognition** dan **liveness detection** untuk sekolah modern.

## 🌟 Fitur Utama

- 🎭 **Face Recognition** menggunakan MediaPipe & Face-API.js
- 👁️ **Liveness Detection** dengan blink detection dan head movement
- 🎨 **Modern UI** dengan TailwindCSS & Framer Motion
- 🔐 **JWT Authentication** dengan auto refresh token
- 📊 **Admin Dashboard** dengan analytics & charts
- 🎤 **Voice Notification** untuk feedback absensi
- 📱 **Responsive Design** untuk mobile & desktop
- ⚡ **Real-time Updates** dengan React Query

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** v18+ atau v20+ (LTS recommended)
- **npm** atau **pnpm** atau **yarn**
- **Backend API** sudah berjalan di `http://localhost:8001`

### 2. Install Dependencies

```bash
# Install packages
npm install

# Download MediaPipe models (required untuk face detection)
npm run download-models
# atau manual:
# powershell -ExecutionPolicy Bypass -File download_models.ps1
```

### 3. Configure Environment

Buat file `.env` di root folder `frontend/`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8001/api/v1

# App Configuration
VITE_APP_NAME=FahrenCenter
VITE_APP_VERSION=1.0.0

# Face Recognition Settings
VITE_FACE_CONFIDENCE_THRESHOLD=0.55
VITE_MIN_FACE_SIZE=80
```

### 4. Run Development Server

```bash
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

---

## 📁 Project Structure

```
frontend/
├── public/
│   ├── models/              # MediaPipe model files (.bin, .task)
│   └── voice/               # Voice notification audio files
├── src/
│   ├── components/          # Reusable components
│   │   ├── features/        # Feature-specific components
│   │   │   ├── face/        # Face recognition components
│   │   │   ├── attendance/  # Attendance components
│   │   │   └── admin/       # Admin components
│   │   ├── layouts/         # Page layouts (MainLayout, AdminLayout)
│   │   └── ui/              # Base UI components (Button, Card, Modal)
│   ├── pages/               # Page components
│   │   ├── public/          # Public pages (Landing, PublicAttendance)
│   │   ├── student/         # Student portal pages
│   │   ├── teacher/         # Teacher portal pages
│   │   └── admin/           # Admin portal pages
│   ├── services/            # API services
│   │   ├── api.ts           # Axios instance with interceptors
│   │   ├── authService.ts   # Authentication API
│   │   ├── faceService.ts   # Face recognition API
│   │   ├── studentService.ts# Student management API
│   │   ├── adminService.ts  # Admin API
│   │   └── settingsService.ts # Settings API
│   ├── stores/              # Zustand global state
│   │   ├── authStore.ts     # Authentication state
│   │   └── uiStore.ts       # UI state (theme, sidebar)
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useFaceDetection.ts # Face detection hook
│   │   └── useVoice.ts      # Voice notification hook
│   ├── utils/               # Utility functions
│   │   ├── faceUtils.ts     # Face processing utilities
│   │   ├── imageUtils.ts    # Image processing utilities
│   │   └── dateUtils.ts     # Date formatting utilities
│   ├── types/               # TypeScript type definitions
│   │   ├── auth.types.ts    # Authentication types
│   │   ├── face.types.ts    # Face recognition types
│   │   └── api.types.ts     # API response types
│   ├── router.tsx           # React Router configuration
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── .env                     # Environment variables (create this!)
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # TailwindCSS config
└── vite.config.ts           # Vite config
```

---

## 🛠️ Tech Stack

### Core Framework
- **React 19** - UI library
- **TypeScript 5.9** - Type safety
- **Vite 7** - Build tool & dev server

### State Management
- **Zustand 5** - Lightweight global state
- **TanStack React Query 5** - Server state & caching

### UI & Styling
- **TailwindCSS 3.4** - Utility-first CSS
- **Framer Motion 12** - Animation library
- **Lucide React** - Icon library
- **Headless UI 2** - Unstyled accessible components

### Form & Validation
- **React Hook Form 7** - Form management
- **Zod 4** - Schema validation

### Face Recognition
- **MediaPipe Face Detection 0.4** - Face detection
- **MediaPipe Face Mesh 0.4** - Facial landmarks
- **Face-API.js 0.22** - Face recognition & encoding

### Data Visualization
- **Recharts 3** - Charts untuk admin dashboard

### HTTP & API
- **Axios 1.13** - HTTP client dengan interceptor
- **React Router DOM 7** - Routing

### Others
- **date-fns 4** - Date utilities
- **react-hot-toast 2** - Toast notifications
- **clsx & tailwind-merge** - Conditional class names

---

## 🎭 Face Recognition Flow

### 1. Face Registration (Student Portal)
```
User → Upload/Capture 3-5 Photos → Quality Check → Face Encoding → Save to Backend
```

**Quality Checks:**
- Blur detection (Laplacian variance)
- Brightness check (mean pixel value)
- Face size minimum (80px)
- Pose angle check (yaw < 30°)

### 2. Liveness Detection (Before Attendance)
```
Webcam → Face Detection → Blink Detection → Head Movement → Pass Liveness
```

**Liveness Rules:**
- Minimum 2 blinks dalam 5 detik
- Head movement detected (optional)
- Screen/photo reflection detection
- Real-time face tracking

### 3. Face Recognition (Attendance)
```
Live Frame → Face Encoding → Compare with Database → Confidence > 55% → Submit Attendance
```

**Recognition Parameters:**
- Algorithm: HOG (Histogram of Oriented Gradients)
- Distance: Euclidean (L2)
- Threshold: 0.55 (default, adjustable)
- Confidence: Minimum 80%

---

## 🔑 Key Components

### `FaceRegistrationPage` (Student Portal)
**Path:** `src/pages/student/FaceRegistrationPage.tsx`

- Upload atau capture wajah dari webcam
- Quality check real-time
- Progress indicator (1/5, 2/5, dst)
- Preview sebelum submit
- Hapus dan re-capture jika perlu

### `LivenessDetection` (Component)
**Path:** `src/components/features/face/LivenessDetection.tsx`

- Blink detection menggunakan Eye Aspect Ratio (EAR)
- Head movement tracking
- Random action prompt (opsional)
- Pass/fail indicator

### `AttendancePage` (Student Portal)
**Path:** `src/pages/student/AttendancePage.tsx`

- Liveness detection dulu
- Face recognition setelah liveness pass
- Confidence score display
- Voice notification "Absensi berhasil"
- Duplicate check (sudah absen hari ini)

### `AdminDashboard` (Admin Portal)
**Path:** `src/pages/admin/AdminDashboard.tsx`

- Total students, teachers, attendance today
- Attendance rate chart (Recharts)
- Recent attendance list
- Quick actions (add student, generate report)

---

## 🌐 Environment Variables

Buat file `.env` di root folder `frontend/`:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8001/api/v1

# App Info
VITE_APP_NAME=FahrenCenter
VITE_APP_VERSION=1.0.0

# Face Recognition Settings
VITE_FACE_CONFIDENCE_THRESHOLD=0.55  # Minimum confidence untuk match
VITE_MIN_FACE_SIZE=80                # Minimum ukuran wajah (px)
VITE_MAX_FACE_DISTANCE=0.6           # Maximum distance untuk match

# Liveness Detection Settings
VITE_LIVENESS_BLINK_THRESHOLD=2      # Minimum blinks
VITE_LIVENESS_TIMEOUT=10000          # Timeout (ms)

# Upload Settings
VITE_MAX_IMAGE_SIZE=5242880          # Max file size (5MB)
VITE_ALLOWED_FORMATS=image/jpeg,image/png

# Feature Flags (optional)
VITE_ENABLE_VOICE_NOTIFICATION=true
VITE_ENABLE_LIVENESS_DETECTION=true
```

**Cara Akses di Code:**
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const threshold = parseFloat(import.meta.env.VITE_FACE_CONFIDENCE_THRESHOLD || '0.55');
```

---

## 🔐 Authentication Flow

### Login
```typescript
// services/authService.ts
export const login = async (nim: string, password: string) => {
  const response = await api.post('/auth/login', { nim, password });
  return response.data; // { access_token, refresh_token, user }
};
```

### Auto Refresh Token
```typescript
// services/api.ts (Axios interceptor)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
      const newAccessToken = await refreshAccessToken();
      // Retry original request
    }
  }
);
```

### Protected Routes
```typescript
// router.tsx
<Route element={<ProtectedRoute roles={['student']} />}>
  <Route path="/student/dashboard" element={<StudentDashboard />} />
</Route>
```

---

## 🧪 Development Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check

# Download MediaPipe models
npm run download-models
```

---

## 📦 Build & Deployment

### Build Production

```bash
npm run build
```

Output di folder `dist/`. Deploy ke:
- **Vercel** (recommended untuk Vite)
- **Netlify**
- **Static hosting** (Nginx, Apache)

### Environment Variables (Production)

Jangan lupa set environment variables di hosting:
```
VITE_API_BASE_URL=https://api.fahrencenter.com/api/v1
```

⚠️ **PENTING:** 
- Untuk production, backend API **HARUS** HTTPS (kamera browser butuh secure context)
- CORS backend harus allow origin frontend

---

## 🐛 Troubleshooting

### 1. Webcam Tidak Muncul
- **Solusi:** Pastikan browser sudah allow camera permission
- Chrome: Settings → Privacy → Site Settings → Camera
- Harus HTTPS di production (localhost OK untuk dev)

### 2. MediaPipe Model 404
- **Solusi:** Jalankan `npm run download-models`
- Model harus ada di `public/models/`

### 3. Face Recognition Tidak Akurat
- **Solusi:** 
  - Cek lighting (tidak terlalu gelap/terang)
  - Pastikan wajah frontal (tidak miring)
  - Adjust `VITE_FACE_CONFIDENCE_THRESHOLD` jika perlu

### 4. Error "Network Error" saat Login
- **Solusi:** 
  - Pastikan backend berjalan di `http://localhost:8001`
  - Cek CORS backend allow `http://localhost:5173`

Untuk troubleshooting lengkap, lihat [TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)

---

## 📖 Documentation

- **Backend API:** [backend/README.md](../backend/README.md)
- **Authentication Guide:** [docs/AUTHENTICATION_GUIDE.md](../docs/AUTHENTICATION_GUIDE.md)
- **Face Registration Guide:** [docs/FACE_REGISTRATION_GUIDE.md](../docs/FACE_REGISTRATION_GUIDE.md)
- **Git Commit Template:** [docs/GIT_COMMIT_TEMPLATE.md](../docs/GIT_COMMIT_TEMPLATE.md)
- **Troubleshooting:** [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)

---

## 🎓 Academic Context

**Project:** FahrenCenter - Smart Attendance System  
**Institution:** Universitas Harkat Negeri  
**Course:** Pengolahan Citra Digital (PCD) - UAS  
**Semester:** 5  
**Year:** 2025/2026

**Contributors:**
- Frontend & Backend Architecture
- Face Recognition Implementation
- System Integration

---

## 📝 Notes

- Sistem ini dirancang untuk **production-ready**, bukan sekadar demo
- Target: sekolah swasta modern dengan 1-3 kelas (< 150 users)
- Face recognition menggunakan **dlib-based FaceNet** (128D encoding)
- Liveness detection **wajib** sebelum absensi (mencegah spoofing)
- UI/UX fokus pada **accessibility** dan **user-friendly**

---

## 🤝 Contributing

Lihat [CONTRIBUTING.md](../CONTRIBUTING.md) untuk panduan kontribusi.

---

**Dibuat dengan 💙 oleh Lycus (Affif)**  
**FahrenCenter** - *"Attendance Made Smart"*  
**Version:** 1.0.0
