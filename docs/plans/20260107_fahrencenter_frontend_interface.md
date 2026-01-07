# 📋 Rencana Pembuatan Interface Frontend FahrenCenter

**Tanggal**: 7 Januari 2026  
**Oleh**: Luna 🌙  
**Proyek**: FahrenCenter Smart Attendance System  
**Tech Stack**: Vite + React + TypeScript + TailwindCSS

---

## 🎯 Tujuan Proyek

Membuat aplikasi frontend web yang modern, responsif, dan user-friendly untuk sistem absensi berbasis face recognition di **FahrenCenter** (Sekolah Swasta), dengan integrasi penuh ke backend API yang sudah ada.

---

## 🏢 Tentang FahrenCenter

**FahrenCenter** adalah sekolah swasta yang menggunakan sistem absensi berbasis teknologi face recognition untuk meningkatkan efisiensi dan akurasi pencatatan kehadiran siswa.

**Karakteristik:**
- Sekolah swasta modern
- Fokus pada teknologi pendidikan
- Sistem keamanan dan tracking yang baik
- Brand identity yang profesional dan trustworthy

---

## 🎨 Design System & Branding

### Color Palette (FahrenCenter Theme)
```css
Primary Colors:
- Primary Blue: #2563EB (Trust, Professional)
- Primary Dark: #1E40AF
- Primary Light: #3B82F6

Secondary Colors:
- Success Green: #10B981 (Hadir)
- Warning Yellow: #F59E0B (Pending)
- Danger Red: #EF4444 (Tidak Hadir)
- Info Cyan: #06B6D4

Neutral Colors:
- Gray 50: #F9FAFB (Background)
- Gray 100: #F3F4F6 (Card Background)
- Gray 200: #E5E7EB (Border)
- Gray 600: #4B5563 (Text Secondary)
- Gray 900: #111827 (Text Primary)
```

### Typography
- **Font Family**: Inter (Modern, Clean, Readable)
- **Headings**: Bold, 700 weight
- **Body**: Regular, 400 weight
- **Small Text**: 300 weight

### Logo & Branding
- Logo FahrenCenter dengan tagline "Smart Attendance System"
- Minimalist design dengan emphasis pada technology & education

---

## 🧠 Face Recognition Technical Specifications

### Image Preprocessing Pipeline
**Tujuan**: Meningkatkan akurasi dengan preprocessing optimal

**Pipeline Steps**:
1. **Image Loading & Validation**
   - Format check (JPEG, PNG)
   - Size validation (min 480x480, max 1920x1920)
   - File size check (max 10MB)

2. **Face Detection (HOG)**
   - Histogram of Oriented Gradients (HOG) algorithm
   - Fast & accurate detection
   - Bounding box extraction
   - Confidence score validation (min 0.6)

3. **Face Alignment**
   - Detect 68 facial landmarks
   - Align face berdasarkan eye positions
   - Rotation correction
   - Perspective transformation

4. **Image Normalization**
   - Resize to standard size (160x160)
   - Brightness adjustment (histogram equalization)
   - Contrast normalization (CLAHE)
   - Color space conversion (RGB → Grayscale jika perlu)

5. **Quality Check**
   - Blur detection (Laplacian variance)
   - Brightness check (mean pixel value)
   - Face size validation
   - Pose estimation (frontal face required)

### Face Encoding Extraction
**Algorithm**: FaceNet-based 128D Encoding

**Specifications**:
- **Model**: dlib's face recognition model
- **Output**: 128-dimensional face embedding vector
- **Range**: [-1, 1] normalized values
- **Properties**:
  - Robust to lighting changes
  - Invariant to minor pose variations
  - Discriminative for identity recognition

**Process**:
```
Image → HOG Detection → Face Alignment → FaceNet Model → 128D Vector
```

### Face Matching (Euclidean Distance)
**Algorithm**: L2 Distance (Euclidean)

**Formula**:
```
distance = √(Σ(ai - bi)²)
where a = known encoding, b = query encoding
```

**Thresholds**:
- **Strict Mode**: distance < 0.45 (95%+ confidence)
- **Standard Mode**: distance < 0.55 (85%+ confidence) ⭐ DEFAULT
- **Lenient Mode**: distance < 0.65 (75%+ confidence)

**Decision Logic**:
```typescript
if (distance < 0.55) {
  confidence = (1 - distance / 0.6) * 100; // 0.0 = 100%, 0.6 = 0%
  if (confidence >= 80%) {
    return { match: true, confidence };
  }
}
return { match: false, confidence: 0 };
```

**Optimization**:
- Pre-compute encodings untuk semua registered faces
- Store di database sebagai binary blob
- Load ke memory untuk fast comparison
- Use NumPy untuk vectorized operations

### Accuracy Optimization
**Target**: Minimum 80% confidence untuk setiap match

**Strategies**:
1. **Multiple Encodings per User**
   - Register 3-5 photos per user
   - Different poses (frontal, left, right)
   - Different lighting conditions
   - Average distance untuk multiple matches

2. **Quality Control**
   - Reject blurry images (Laplacian < 100)
   - Reject dark images (mean < 50)
   - Reject small faces (size < 80px)
   - Reject extreme poses (yaw > 30°)

3. **False Positive Prevention**
   - Use best match only (min distance)
   - Reject if distance > threshold
   - Reject if confidence < 80%
   - Log suspicious attempts

4. **Performance Monitoring**
   - Track accuracy per user
   - Identify problematic registrations
   - Suggest re-registration if accuracy drops

### Technical Implementation

#### Frontend (TypeScript)
```typescript
// Face preprocessing
function preprocessFace(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // 1. Resize to standard size
  canvas.width = 640;
  canvas.height = 640;
  ctx.drawImage(image, 0, 0, 640, 640);
  
  // 2. Enhance contrast (CLAHE-like)
  const imageData = ctx.getImageData(0, 0, 640, 640);
  enhanceContrast(imageData);
  ctx.putImageData(imageData, 0, 0);
  
  // 3. Brightness normalization
  normalizeBrightness(ctx, canvas);
  
  return canvas;
}

// Convert to base64
function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.95);
}
```

#### Backend (Python - Already Implemented)
```python
# Face detection with HOG
import face_recognition

def detect_face_hog(image_array):
    face_locations = face_recognition.face_locations(
        image_array,
        model='hog'  # Fast & accurate
    )
    return face_locations

# Extract 128D encoding
def extract_face_encoding(image_array):
    encodings = face_recognition.face_encodings(
        image_array,
        model='large'  # High accuracy model
    )
    return encodings[0] if encodings else None

# Compare faces with Euclidean distance
def compare_faces(known_encodings, face_encoding, tolerance=0.55):
    distances = face_recognition.face_distance(
        known_encodings,
        face_encoding
    )
    
    min_distance = min(distances)
    confidence = (1 - min_distance / 0.6) * 100
    
    is_match = min_distance < tolerance and confidence >= 80
    
    return is_match, confidence, min_distance
```

### Liveness Detection
**Purpose**: Prevent spoofing attacks (photos, videos)

**Frontend Implementation** (MediaPipe):
1. **Blink Detection**
   - Detect eye aspect ratio (EAR)
   - Require 2-3 blinks in 3 seconds

2. **Motion Detection**
   - Detect slight head movement
   - Random prompt: "Turn left", "Smile", etc.

3. **Texture Analysis**
   - Detect screen reflections
   - Detect print artifacts

**Integration**:
- Run liveness check BEFORE face recognition
- Only proceed if liveness passed
- Show real-time feedback to user

---

## 📱 Struktur Aplikasi

### 1. **Public Pages** (No Authentication Required)

#### A. Landing Page (`/`)
**Tujuan**: Memberikan informasi tentang sistem dan login/register access

**Fitur**:
- Hero section dengan tagline: "FahrenCenter - Attendance Made Smart"
- Features showcase (Face Recognition, Real-time Tracking, Secure)
- CTA buttons: "Login", "Register", & **"Absen Sekarang"** (Public Attendance)
- Footer dengan info sekolah

**Design**:
```
┌─────────────────────────────────────┐
│  Header (Logo + Nav)                │
├─────────────────────────────────────┤
│  Hero Section                        │
│  - Title & Tagline                   │
│  - Illustration/Image                │
│  - [Absen Sekarang] (Prominent)     │
│  - Login & Register Buttons          │
├─────────────────────────────────────┤
│  Features Section (3 Cards)         │
│  - Face Recognition                  │
│  - Real-time Tracking                │
│  - Secure & Reliable                 │
├─────────────────────────────────────┤
│  How It Works (3 Steps)             │
│  - Register Face                     │
│  - Scan Face                         │
│  - Track Attendance                  │
├─────────────────────────────────────┤
│  Footer                              │
└─────────────────────────────────────┘
```

#### D. **Public Attendance Page (`/public/absen`)** ⭐ NEW!
**Tujuan**: Siswa dapat melakukan absensi TANPA LOGIN dengan face recognition

**Fitur**:
- **Tidak perlu login** - Langsung scan wajah
- Live camera preview dengan HOG face detection
- Face preprocessing otomatis (alignment, brightness, contrast)
- Liveness detection dengan MediaPipe
- Real-time confidence indicator
- Bounding box & landmarks overlay
- "Scan Face" button
- Auto-submit setelah face recognized
- Success notification dengan voice: "Selamat datang, [Nama Siswa]"
- Error handling jika wajah tidak terdaftar

**Workflow**:
1. Siswa klik "Absen Sekarang" dari landing page
2. Redirect ke `/public/absen`
3. Kamera aktif → MediaPipe liveness detection
4. HOG face detection real-time
5. Preprocessing citra otomatis (alignment, normalization)
6. Extract 128D face encoding
7. Siswa klik "Scan Face"
8. Backend compare dengan Euclidean distance
9. Jika match (distance < 0.55) → Auto submit attendance
10. Show success + voice notification
11. Redirect kembali ke landing page

**API Integration**:
- `POST /api/v1/face/scan` (recognize face tanpa auth)
- `POST /api/v1/absensi/public-submit` (submit attendance tanpa auth) ⭐ NEW ENDPOINT

**Security**:
- Rate limiting (max 5 attempts per 1 minute)
- IP tracking untuk abuse prevention
- CAPTCHA setelah 3 failed attempts

#### B. Login Page (`/login`)
**Tujuan**: Autentikasi user (siswa/admin)

**Fitur**:
- Form login (NIM & Password)
- "Remember Me" checkbox
- "Forgot Password?" link (optional)
- Link ke Register page
- Error handling & validation

**API Integration**:
- `POST /api/v1/auth/login`
- Store tokens (access_token, refresh_token) in localStorage/cookies
- Redirect based on role (admin → dashboard, user → student portal)

#### C. Register Page (`/register`)
**Tujuan**: Registrasi siswa baru

**Fitur**:
- Form register (NIM, Name, Email, Password, Kelas)
- Password strength indicator
- Terms & conditions checkbox
- Link ke Login page
- Success notification

**API Integration**:
- `POST /api/v1/auth/register`
- Auto login after successful registration
- Redirect to face registration page

---

### 2. **Student Portal** (Role: User)

#### A. Dashboard Siswa (`/dashboard`)
**Tujuan**: Overview kehadiran siswa

**Fitur**:
- Greeting: "Selamat datang, [Nama Siswa]"
- Status registrasi wajah (sudah/belum)
- Quick Stats Cards:
  - Total Kehadiran
  - Tingkat Kehadiran (%)
  - Current Streak
- Button "Absen Sekarang" (prominent)
- Recent Attendance History (5 terakhir)

**Design**:
```
┌─────────────────────────────────────┐
│  Sidebar | Header (Profile + Notif) │
├──────────┼──────────────────────────┤
│  Menu    │  Greeting & Status       │
│  Items   │  ┌─────┬─────┬─────┐    │
│          │  │Stats│Stats│Stats│    │
│          │  └─────┴─────┴─────┘    │
│          │  [Absen Sekarang Button] │
│          │  Recent History Table    │
└──────────┴──────────────────────────┘
```

#### B. Absensi Page (`/absen`)
**Tujuan**: Melakukan absensi dengan face recognition

**Fitur**:
- Live camera preview
- Face detection indicator (bounding box)
- Liveness detection (MediaPipe)
- "Capture & Submit" button
- Loading state during processing
- Success/Error feedback dengan suara: "Selamat datang, [Nama]"

**Workflow**:
1. User klik "Absen Sekarang"
2. Kamera aktif → MediaPipe deteksi wajah
3. User klik "Capture"
4. Base64 image → API `/face/scan` (recognize)
5. Jika recognized → Submit to `/absensi/submit`
6. Show success dengan voice notification

**API Integration**:
- `POST /api/v1/face/scan` (recognize face)
- `POST /api/v1/absensi/submit` (submit attendance)

#### C. Registrasi Wajah (`/register-face`)
**Tujuan**: Mendaftarkan wajah siswa (3-5 foto)

**Fitur**:
- Instructions: "Ambil 3-5 foto wajah dengan pose berbeda"
- Camera preview dengan guide (oval face frame)
- Progress indicator (1/3, 2/3, 3/3)
- Preview captured images
- "Submit Registration" button

**API Integration**:
- `POST /api/v1/face/register` (submit multiple images)

#### D. Riwayat Absensi (`/history`)
**Tujuan**: Melihat history kehadiran siswa

**Fitur**:
- Filter by date range
- Search by date
- Table view dengan:
  - Tanggal
  - Waktu Masuk
  - Status (Hadir/Tidak Hadir)
  - Confidence Score
- Pagination
- Export to CSV (optional)

**API Integration**:
- `GET /api/v1/absensi/history`
- `GET /api/v1/absensi/today` (untuk hari ini)

#### E. Profile Page (`/profile`)
**Tujuan**: Mengelola profile siswa

**Fitur**:
- View & edit profile (Name, Email, Kelas)
- Change password
- View face registration status
- Button "Re-register Face"
- Statistics summary

**API Integration**:
- `GET /api/v1/auth/me` (get current user)
- `PUT /api/v1/auth/password` (change password)

---

### 3. **Admin Portal** (Role: Admin)

#### A. Admin Dashboard (`/admin/dashboard`)
**Tujuan**: Overview sistem keseluruhan

**Fitur**:
- Key Metrics Cards:
  - Total Siswa
  - Siswa dengan Wajah Terdaftar (%)
  - Kehadiran Hari Ini
  - Tingkat Kehadiran Bulan Ini
- Charts:
  - Attendance Trend (Line Chart - 7 hari terakhir)
  - Class Attendance Rate (Bar Chart)
  - Registration Status (Pie Chart)
- Recent Activity Log (10 terakhir)

**API Integration**:
- `GET /api/v1/admin/dashboard`

#### B. Manajemen Siswa (`/admin/students`)
**Tujuan**: CRUD siswa & guru dengan monitoring lengkap

**Fitur**:
- **Tabs**: "Siswa" & "Guru"
- Table dengan kolom:
  - NIM/NIP
  - Nama
  - Kelas (untuk siswa) / Mata Pelajaran (untuk guru)
  - Email
  - Status Wajah (✓/✗)
  - Status Aktif (Active/Inactive)
  - Last Login
  - Actions (View, Edit, Delete)
- Filter by:
  - Role (Siswa/Guru)
  - Kelas (untuk siswa)
  - Status Wajah (Sudah/Belum)
  - Status Aktif
- Search by NIM/NIP/Nama
- Button **"+ Tambah Siswa"** & **"+ Tambah Guru"**
- Bulk actions:
  - Export to CSV
  - Import from CSV
  - Bulk activate/deactivate
  - Bulk delete (dengan confirmation)

**Modal: Tambah Siswa**
- Form fields:
  - NIM (auto-generate atau manual)
  - Nama Lengkap*
  - Email*
  - Kelas*
  - Password (default atau custom)
  - Upload foto (optional)
- Validasi real-time
- Submit → Create user + redirect to face registration (optional)

**Modal: Tambah Guru**
- Form fields:
  - NIP (auto-generate atau manual)
  - Nama Lengkap*
  - Email*
  - Mata Pelajaran*
  - Password (default atau custom)
  - Upload foto (optional)
- Role = "teacher" (guru juga bisa login & absen)

**Modal: Edit**
- Pre-filled form dengan data existing
- Update profile + password change (optional)
- Save → Update database

**Modal: Delete Confirmation**
- Warning message: "Hapus [Nama]? Semua data termasuk wajah dan riwayat absensi akan dihapus."
- Checkbox: "Saya yakin ingin menghapus"
- Button: "Ya, Hapus" (danger) & "Batal"
- Soft delete (is_active = false) atau hard delete

**API Integration**:
- `GET /api/v1/admin/students` (list dengan pagination & filter)
- `GET /api/v1/admin/teachers` (list guru) ⭐ NEW ENDPOINT
- `GET /api/v1/admin/students/{id}` (detail)
- `POST /api/v1/admin/students` (create siswa)
- `POST /api/v1/admin/teachers` (create guru) ⭐ NEW ENDPOINT
- `PUT /api/v1/admin/students/{id}` (update)
- `DELETE /api/v1/admin/students/{id}` (delete - dengan cascade)
- `POST /api/v1/admin/students/import` (import CSV) ⭐ NEW ENDPOINT
- `GET /api/v1/admin/students/export` (export CSV)

#### C. Detail Siswa (`/admin/students/:id`)
**Tujuan**: Lihat detail lengkap siswa

**Fitur**:
- Informasi Lengkap (NIM, Nama, Kelas, Email, etc)
- Face Registration Status & Images
- Attendance Statistics:
  - Total Kehadiran
  - Tingkat Kehadiran
  - Current Streak
  - Last Attendance
- Attendance History (table + chart)
- Button Actions:
  - Edit Profile
  - Reset Password
  - Force Face Re-registration
  - Deactivate/Activate Account

#### D. Laporan Kehadiran (`/admin/attendance`)
**Tujuan**: Monitoring & reporting kehadiran lengkap

**Fitur**:
- **Advanced Filters**:
  - Date Range (Start - End date)
  - Kelas (dropdown multi-select)
  - Siswa (autocomplete search)
  - Status (Hadir/Tidak Hadir/Semua)
  - Confidence level (< 80%, 80-90%, > 90%)
  
- **Table view dengan kolom**:
  - Tanggal
  - NIM
  - Nama
  - Kelas
  - Waktu Masuk
  - Confidence Score (dengan color indicator)
  - Image Preview (thumbnail)
  - Actions (View Detail, Download Image)
  
- **Statistics Summary**:
  - Total Hadir
  - Total Tidak Hadir
  - Tingkat Kehadiran (%)
  - Average Confidence Score
  
- **Visualization**:
  - Line Chart: Kehadiran per hari (7/30 hari)
  - Bar Chart: Kehadiran per kelas
  - Pie Chart: Hadir vs Tidak Hadir
  - Heatmap: Kehadiran per jam (peak hours)
  
- **Export Options**:
  - Export to CSV (filtered data)
  - Export to PDF (formatted report)
  - Export to Excel (dengan charts)
  - Print Report
  
- **Bulk Actions**:
  - Mark as verified
  - Delete selected records (admin only)
  
- **Real-time Updates**:
  - Auto-refresh every 30 seconds
  - Show "New attendance" badge

**API Integration**:
- `GET /api/v1/admin/attendance` (list dengan advanced filter & pagination)
- `GET /api/v1/admin/attendance/stats` (statistics summary) ⭐ NEW ENDPOINT
- `GET /api/v1/admin/attendance/export/csv` (CSV export dengan filter)
- `GET /api/v1/admin/attendance/export/pdf` (PDF report) ⭐ NEW ENDPOINT
- `GET /api/v1/admin/attendance/export/excel` (Excel export) ⭐ NEW ENDPOINT
- `DELETE /api/v1/admin/attendance/{id}` (delete record) ⭐ NEW ENDPOINT
- `POST /api/v1/admin/attendance/bulk-delete` (bulk delete) ⭐ NEW ENDPOINT

#### E. Pengaturan Sistem (`/admin/settings`)
**Tujuan**: Konfigurasi sistem

**Fitur**:
- General Settings:
  - Nama Sekolah
  - Tahun Ajaran
  - Semester
- Face Recognition Settings:
  - Tolerance Level
  - Minimum Confidence
  - Liveness Detection (Enable/Disable)
- Notification Settings:
  - Voice Notification (Enable/Disable)
  - Email Notification (Enable/Disable)
- Admin Account Management

---

## 🧩 Component Architecture

### Core Components

#### 1. Layout Components
- `AppLayout.tsx` - Main layout dengan sidebar & header
- `PublicLayout.tsx` - Layout untuk public pages
- `AdminLayout.tsx` - Layout khusus admin
- `Sidebar.tsx` - Navigation sidebar
- `Header.tsx` - Top header dengan profile & notifications
- `Footer.tsx` - Footer component

#### 2. UI Components (Reusable)
- `Button.tsx` - Custom button dengan variants
- `Card.tsx` - Card container
- `Input.tsx` - Form input dengan validation
- `Table.tsx` - Data table dengan sorting & pagination
- `Modal.tsx` - Modal dialog
- `Badge.tsx` - Status badge
- `Alert.tsx` - Alert notifications
- `Loading.tsx` - Loading spinner/skeleton
- `Chart.tsx` - Chart wrapper (Chart.js/Recharts)

#### 3. Feature Components
- `FaceCamera.tsx` - Camera capture component
- `FaceDetection.tsx` - Face detection dengan MediaPipe
- `AttendanceCard.tsx` - Attendance stats card
- `StudentTable.tsx` - Student list table
- `AttendanceTable.tsx` - Attendance history table
- `ProfileCard.tsx` - User profile card
- `StatsCard.tsx` - Statistics card

---

## 🔧 Technical Stack & Dependencies

### Core
- **Vite** - Build tool (fast HMR)
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router DOM** - Routing

### Styling
- **TailwindCSS 3.4** - Utility-first CSS
- **clsx** - Conditional classes
- **tailwind-merge** - Merge Tailwind classes

### State Management
- **Zustand** - Global state (auth, user, etc)
- **React Query (TanStack Query)** - Server state & caching

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Face Recognition & Camera
- **MediaPipe** - Face detection & liveness
- **face-api.js** (optional fallback) - Face detection

### HTTP Client
- **Axios** - API requests dengan interceptors

### UI Components Library (Optional)
- **Headless UI** - Accessible components
- **Radix UI** - Primitive components

### Charts & Visualization
- **Recharts** - Chart library

### Utilities
- **date-fns** - Date manipulation
- **react-hot-toast** - Toast notifications
- **clsx** - Conditional classnames

### Audio
- **Web Speech API** - Text-to-Speech untuk notifikasi

---

## 🗂️ Folder Structure

```
frontend/
├── public/
│   ├── mediapipe/          # MediaPipe models
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── assets/             # Images, fonts, etc
│   │   ├── images/
│   │   └── fonts/
│   ├── components/         # Reusable components
│   │   ├── layouts/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── ui/             # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Modal.tsx
│   │   └── features/       # Feature-specific components
│   │       ├── FaceCamera.tsx
│   │       ├── AttendanceCard.tsx
│   │       └── StudentTable.tsx
│   ├── pages/              # Page components
│   │   ├── public/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── student/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AbsensiPage.tsx
│   │   │   ├── RegisterFacePage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── StudentsPage.tsx
│   │       ├── StudentDetailPage.tsx
│   │       ├── AttendancePage.tsx
│   │       └── SettingsPage.tsx
│   ├── services/           # API services
│   │   ├── api.ts          # Axios instance
│   │   ├── authService.ts
│   │   ├── faceService.ts
│   │   ├── attendanceService.ts
│   │   └── adminService.ts
│   ├── stores/             # Zustand stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCamera.ts
│   │   ├── useFaceDetection.ts
│   │   └── useVoiceNotification.ts
│   ├── utils/              # Utility functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── types/              # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── attendance.types.ts
│   │   └── api.types.ts
│   ├── App.tsx             # Main App component
│   ├── main.tsx            # Entry point
│   ├── router.tsx          # React Router config
│   └── index.css           # Global styles
├── .env.example            # Environment variables template
├── .env.local              # Local environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🔐 Authentication Flow

### Login Flow
1. User masukkan NIM & Password di `/login`
2. Submit → `POST /api/v1/auth/login`
3. Response: `{ access_token, refresh_token, user }`
4. Store tokens di localStorage
5. Set user di authStore
6. Redirect based on role:
   - Admin → `/admin/dashboard`
   - User → `/dashboard`

### Token Refresh
1. Axios interceptor detect 401 error
2. Coba refresh token → `POST /api/v1/auth/refresh`
3. Jika success: update access_token & retry request
4. Jika fail: logout & redirect ke `/login`

### Protected Routes
```typescript
<Route element={<ProtectedRoute allowedRoles={['user']} />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/absen" element={<AbsensiPage />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
</Route>
```

---

## 📸 Face Recognition Integration

### MediaPipe Setup
```typescript
// Load MediaPipe Face Detection
import { FaceDetection } from '@mediapipe/face_detection';

const faceDetection = new FaceDetection({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
});

faceDetection.setOptions({
  model: 'short',
  minDetectionConfidence: 0.5
});
```

### Camera Capture Flow
1. Request camera permission
2. Stream to `<video>` element
3. MediaPipe deteksi wajah real-time
4. Tampilkan bounding box overlay
5. User klik "Capture"
6. Convert frame ke base64
7. Submit ke backend API

---

## 📊 Data Flow & State Management

### Zustand Auth Store
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}
```

### React Query for API
```typescript
// Fetch attendance history
const { data, isLoading } = useQuery({
  queryKey: ['attendance-history', userId],
  queryFn: () => attendanceService.getHistory(userId)
});

// Submit attendance mutation
const mutation = useMutation({
  mutationFn: attendanceService.submit,
  onSuccess: () => {
    queryClient.invalidateQueries(['attendance-history']);
    toast.success('Absensi berhasil!');
  }
});
```

---

## 🎨 UI/UX Guidelines

### Responsiveness
- Mobile-first design
- Breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

### Accessibility
- ARIA labels untuk interactive elements
- Keyboard navigation support
- Focus indicators
- Alt text untuk images
- Color contrast ratio ≥ 4.5:1

### Loading States
- Skeleton loaders untuk tables
- Spinner untuk buttons
- Progress bar untuk file uploads

### Error Handling
- Form validation errors (inline)
- API error toast notifications
- Fallback UI untuk errors

---

## 🚀 Development Phases

### Phase 1: Project Setup (Day 1)
- [x] Initialize Vite project
- [x] Install dependencies
- [x] Setup TailwindCSS
- [x] Configure TypeScript
- [x] Setup folder structure
- [x] Create .env files
- [x] Setup Axios & interceptors

### Phase 2: Authentication & Core (Day 2-3)
- [x] Create auth services
- [x] Build Login page
- [x] Build Register page
- [x] Implement auth store
- [x] Protected routes setup
- [x] Landing page

### Phase 3: Student Portal (Day 4-5)
- [x] Student Dashboard
- [x] Face Registration page
- [x] Camera component
- [x] MediaPipe integration
- [x] Absensi page
- [x] History page
- [x] Profile page

### Phase 4: Admin Portal (Day 6-7)
- [x] Admin Dashboard
- [x] Students management
- [x] Student detail page
- [x] Attendance reports
- [x] Settings page

### Phase 5: Polish & Testing (Day 8-9)
- [x] UI/UX refinements
- [x] Voice notifications
- [x] Error handling improvements
- [x] Loading states
- [x] Responsive design
- [x] Cross-browser testing

### Phase 6: Deployment (Day 10)
- [x] Production build
- [x] Environment setup
- [x] Deploy to hosting
- [x] Documentation

---

## 🧪 Testing Strategy

### Unit Testing
- Component tests dengan Vitest + React Testing Library
- Utility function tests
- Service tests

### Integration Testing
- API integration tests
- Authentication flow tests
- Face registration flow tests

### E2E Testing (Optional)
- Playwright/Cypress untuk critical user flows

---

## 📦 Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8001/api/v1
VITE_API_TIMEOUT=30000

# App Configuration
VITE_APP_NAME=FahrenCenter Smart Attendance
VITE_APP_VERSION=1.0.0

# MediaPipe
VITE_MEDIAPIPE_CDN=https://cdn.jsdelivr.net/npm/@mediapipe

# Feature Flags
VITE_ENABLE_VOICE_NOTIFICATION=true
VITE_ENABLE_LIVENESS_DETECTION=true
```

---

## 📝 API Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (return user with role detection)
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user (dengan role & permissions)
- `PUT /auth/password` - Change password
- `POST /auth/logout` - Logout

### Face Recognition
- `POST /face/register` - Register face (authenticated)
- `POST /face/scan` - Scan & recognize face (public/authenticated)
- `GET /face/status` - Get face registration status

### Attendance (Student)
- `POST /absensi/submit` - Submit attendance (authenticated)
- `POST /absensi/public-submit` - Submit attendance (public - no auth) ⭐ NEW
- `GET /absensi/history` - Get history
- `GET /absensi/today` - Get today's attendance
- `GET /absensi/stats` - Get statistics

### Admin - Dashboard
- `GET /admin/dashboard` - Dashboard stats dengan:
  - Total siswa & guru
  - Face registration stats
  - Today's attendance
  - Monthly statistics
  - Recent activity logs

### Admin - Users Management
- `GET /admin/students` - List students (pagination, filter, search)
- `GET /admin/teachers` - List teachers ⭐ NEW
- `GET /admin/users/{id}` - User detail (siswa/guru)
- `POST /admin/students` - Create student
- `POST /admin/teachers` - Create teacher ⭐ NEW
- `PUT /admin/users/{id}` - Update user (siswa/guru)
- `DELETE /admin/users/{id}` - Delete user (dengan cascade)
- `POST /admin/students/import` - Import CSV ⭐ NEW
- `GET /admin/students/export` - Export CSV

### Admin - Attendance Reports
- `GET /admin/attendance` - List attendance (advanced filter)
- `GET /admin/attendance/stats` - Statistics summary ⭐ NEW
- `GET /admin/attendance/export/csv` - Export CSV
- `GET /admin/attendance/export/pdf` - Export PDF ⭐ NEW
- `GET /admin/attendance/export/excel` - Export Excel ⭐ NEW
- `DELETE /admin/attendance/{id}` - Delete record ⭐ NEW
- `POST /admin/attendance/bulk-delete` - Bulk delete ⭐ NEW

### Admin - Analytics
- `GET /admin/analytics/overview` - Overview analytics ⭐ NEW
- `GET /admin/analytics/by-class` - Kehadiran per kelas ⭐ NEW
- `GET /admin/analytics/by-time` - Kehadiran per jam ⭐ NEW
- `GET /admin/analytics/trends` - Trend kehadiran ⭐ NEW

---

## ✅ Success Criteria

### Functional Requirements
- ✅ User dapat login & register
- ✅ User dapat mendaftar wajah (3-5 foto)
- ✅ User dapat melakukan absensi dengan face recognition
- ✅ User dapat melihat history kehadiran
- ✅ Admin dapat mengelola siswa (CRUD)
- ✅ Admin dapat melihat laporan kehadiran
- ✅ Sistem mengeluarkan notifikasi suara saat absensi berhasil

### Non-Functional Requirements
- ✅ Responsive di semua device (mobile, tablet, desktop)
- ✅ Fast loading (< 3 detik)
- ✅ Secure authentication dengan JWT
- ✅ User-friendly interface
- ✅ Accessible (WCAG 2.1 Level AA)
- ✅ Cross-browser compatible

---

## 🔮 Future Enhancements

### Phase 2 Features
- Push notifications (PWA)
- Mobile app (React Native)
- Email notifications
- SMS notifications
- Multi-language support
- Dark mode
- Advanced analytics
- Schedule management
- Leave request system
- Parent portal

---

## 📚 Documentation

### Developer Documentation
- API integration guide
- Component documentation (Storybook)
- State management guide
- Testing guide

### User Documentation
- User manual (Siswa)
- Admin manual
- FAQ
- Troubleshooting guide

---

## 🎉 Conclusion

Rencana ini memberikan blueprint lengkap untuk membangun interface frontend FahrenCenter yang modern, aman, dan terintegrasi penuh dengan backend API. Dengan menggunakan Vite + React + TypeScript + TailwindCSS, aplikasi akan memiliki performa tinggi, type-safe, dan mudah di-maintain.

**Estimasi Waktu**: 10 hari kerja  
**Tech Stack**: ⚡ Vite + ⚛️ React + 📘 TypeScript + 🎨 TailwindCSS

---

**Luna 🌙** - AbsensiAgent  
*"Attendance Made Smart"*
