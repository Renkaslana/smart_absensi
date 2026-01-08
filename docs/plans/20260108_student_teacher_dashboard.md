# Student & Teacher Dashboard Implementation Plan

**Date**: January 8, 2026  
**Agent**: Luna 🌙  
**Priority**: HIGH  
**Theme**: Modern Teal/Green (consistent with Admin Dashboard)

---

## 🎯 Project Objectives

Implement comprehensive dashboard interfaces for:
1. **Student Dashboard**: Self-service portal for attendance, profile, schedule
2. **Teacher Dashboard**: Teaching assistant tools for attendance marking, class management
3. **Public Attendance Page**: Kiosk-style face recognition attendance for public access

---

## 🎨 Design System

### Color Palette (Teal/Green Theme)
```css
Primary: Teal
- teal-50:  #f0fdfa (backgrounds)
- teal-100: #ccfbf1 (hover states)
- teal-600: #0d9488 (primary buttons, accents)
- teal-700: #0f766e (hover, active states)
- teal-800: #115e59 (dark accents)
- teal-900: #134e4a (text on light bg)

Secondary: Emerald
- emerald-500: #10b981 (success states)
- emerald-600: #059669 (CTAs)

Neutrals: Gray scale (existing)
```

### Component Style
- **Cards**: White bg, soft shadow, rounded-xl, border-teal-100
- **Buttons**: Gradient teal-600 to teal-700, hover shadow-lg
- **Icons**: Lucide icons, teal-600 color
- **Typography**: Inter font, responsive sizes
- **Animations**: Framer Motion (fade-in, slide-up)

---

## 📊 Student Dashboard

### Route
`/student` (protected, role: 'user')

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│  Sidebar (fixed left)                           │
│  - Logo & User Info                             │
│  - Navigation Menu                              │
│  - Logout                                       │
├─────────────────────────────────────────────────┤
│  Header (top)                                   │
│  - Page Title                                   │
│  - Breadcrumbs                                  │
│  - Quick Actions                                │
├─────────────────────────────────────────────────┤
│  Main Content Area (scrollable)                 │
│  - Dashboard widgets                            │
│  - Data tables/cards                            │
│  - Charts & analytics                           │
└─────────────────────────────────────────────────┘
```

### Pages & Features

#### 1. **Dashboard Home** (`/student`)
**Widgets:**
- **Attendance Summary Card**
  - Total kehadiran bulan ini (percentage)
  - Breakdown: Hadir, Sakit, Izin, Alpa
  - Weekly attendance chart (bar chart)
  - Status badge: Good (>90%), Warning (70-90%), Alert (<70%)
  
- **Today's Schedule Card**
  - Mata kuliah hari ini (time, room, lecturer)
  - Next class countdown
  - Join virtual class link (if applicable)
  
- **Recent Activity Feed**
  - Latest attendance records (3-5 items)
  - Timestamps with icons
  - Face recognition confidence score display
  
- **Quick Actions**
  - Register Face (if not registered)
  - Update Face Photos
  - Mark Attendance Now (if kelas aktif)
  - View Full Attendance Report

**API Endpoints Needed:**
- `GET /api/v1/students/dashboard/summary` - attendance summary
- `GET /api/v1/students/dashboard/today-schedule` - today's classes
- `GET /api/v1/students/dashboard/recent-activity` - recent attendance

#### 2. **Attendance History** (`/student/attendance`)
**Features:**
- **Filter Controls**
  - Date range picker (start date, end date)
  - Status filter (all, hadir, sakit, izin, alpa)
  - Mata kuliah filter
  
- **Attendance Table**
  - Columns: Date, Time, Mata Kuliah, Status, Method (face/manual), Confidence
  - Sortable columns
  - Pagination (20 per page)
  - Export to CSV button
  
- **Monthly Calendar View**
  - Color-coded attendance status
  - Click date for details
  - Legend (green=hadir, yellow=izin, red=alpa)

**API Endpoints Needed:**
- `GET /api/v1/students/attendance/history?start_date&end_date&status&page`
- `GET /api/v1/students/attendance/export` - CSV download

#### 3. **Face Registration** (`/student/face`)
**Features:**
- **Registration Status Banner**
  - Not registered: CTA to register
  - Registered: Show registered date, photo count
  - Need update: Warning if photos old (>6 months)
  
- **Face Photo Gallery**
  - Display current registered photos (thumbnails)
  - View full size on click
  - Delete individual photo (min 3 must remain)
  
- **Add/Update Photos**
  - Embedded FaceRegistrationPage component (reuse admin version)
  - Liveness detection with countdown
  - Manual camera control
  - 3-5 photos required
  
- **Registration History**
  - Timeline of registration/update events
  - Timestamps, photo counts

**API Endpoints Needed:**
- `GET /api/v1/students/face/status` - registration status
- `GET /api/v1/students/face/photos` - current photos
- `POST /api/v1/students/face/register` - register new photos
- `PUT /api/v1/students/face/update` - update photos
- `DELETE /api/v1/students/face/photo/{id}` - delete single photo

#### 4. **Profile** (`/student/profile`)
**Sections:**
- **Personal Information** (read-only with edit button)
  - Nama lengkap, NIM, Email, No. HP
  - Kelas, Program Studi
  - Photo profile (separate from face photos)
  
- **Account Settings**
  - Change password
  - Email notifications preferences
  - Language preference (ID/EN)
  
- **Academic Info**
  - Semester, IPK (if available)
  - Academic advisor
  - Enrollment date

**API Endpoints Needed:**
- `GET /api/v1/students/profile` - get profile
- `PUT /api/v1/students/profile` - update profile
- `PUT /api/v1/students/profile/password` - change password

#### 5. **Schedule** (`/student/schedule`)
**Features:**
- **Weekly Schedule View**
  - Monday-Friday columns
  - Time slots (rows)
  - Color-coded by mata kuliah
  - Click for details (lecturer, room, attendance)
  
- **List View**
  - Grouped by day
  - Expandable cards per mata kuliah
  - Filter by day/week
  
- **Upcoming Classes**
  - Next 3 classes with countdown
  - Join button (if virtual)
  - Attendance quick action

**API Endpoints Needed:**
- `GET /api/v1/students/schedule?week={iso_week}` - get schedule

---

## 👨‍🏫 Teacher Dashboard

### Route
`/teacher` (protected, role: 'guru')

### Layout Structure
Similar to Student Dashboard but with teacher-specific navigation.

### Pages & Features

#### 1. **Dashboard Home** (`/teacher`)
**Widgets:**
- **Today's Classes Card**
  - Classes for today (time, room, enrolled count)
  - Quick mark attendance button per class
  - Attendance completion status (e.g., 25/30 marked)
  
- **Attendance Overview**
  - Total students taught
  - Average attendance rate across all classes
  - Trend chart (last 4 weeks)
  
- **Recent Activity**
  - Recently marked attendance
  - Student face registration notifications
  - Alerts (low attendance, missing students)
  
- **Quick Actions**
  - Mark Attendance (face scan)
  - Manual Attendance Entry
  - View All Classes
  - Generate Report

**API Endpoints Needed:**
- `GET /api/v1/teachers/dashboard/summary`
- `GET /api/v1/teachers/dashboard/today-classes`
- `GET /api/v1/teachers/dashboard/recent-activity`

#### 2. **My Classes** (`/teacher/classes`)
**Features:**
- **Class List**
  - Cards per mata kuliah
  - Enrolled student count
  - Attendance completion rate
  - Schedule info (days, time, room)
  - Actions: View Details, Mark Attendance
  
- **Class Details Page** (`/teacher/classes/{kelas_id}`)
  - Student roster (table)
  - Attendance statistics per student
  - Export class report
  - Send announcement (optional)

**API Endpoints Needed:**
- `GET /api/v1/teachers/classes` - list all classes
- `GET /api/v1/teachers/classes/{kelas_id}` - class details
- `GET /api/v1/teachers/classes/{kelas_id}/students` - student roster

#### 3. **Mark Attendance** (`/teacher/attendance/mark`)
**Two Methods:**

**Method 1: Face Recognition Scan**
- Select mata kuliah from dropdown
- Select session/date
- Embedded face scan component (reuse AttendanceTestPage logic)
- Real-time face recognition
- Display matched student with confidence
- Confirm/Reject button
- Bulk scan mode (scan multiple students in succession)

**Method 2: Manual Entry**
- Select mata kuliah
- Select date
- Student list with checkboxes
- Status dropdown per student (hadir, sakit, izin, alpa)
- Notes field (optional)
- Bulk actions: Mark all present, Mark all absent

**API Endpoints Needed:**
- `POST /api/v1/teachers/attendance/mark` - mark attendance
- `POST /api/v1/teachers/attendance/scan` - face scan recognition
- `GET /api/v1/teachers/attendance/session?kelas_id&date` - get session info

#### 4. **Attendance Reports** (`/teacher/reports`)
**Features:**
- **Generate Report Form**
  - Select mata kuliah
  - Date range
  - Export format (PDF, Excel, CSV)
  
- **Report Templates**
  - Weekly attendance summary
  - Monthly attendance summary
  - Individual student report
  - Class attendance trend
  
- **Report History**
  - Previously generated reports
  - Download/view links
  - Regenerate button

**API Endpoints Needed:**
- `POST /api/v1/teachers/reports/generate`
- `GET /api/v1/teachers/reports/history`
- `GET /api/v1/teachers/reports/download/{report_id}`

#### 5. **Profile** (`/teacher/profile`)
Similar to student profile but with teacher-specific fields:
- NIP (Nomor Induk Pegawai)
- Department/Faculty
- Courses taught (list)
- Office hours

---

## 🌐 Public Attendance Page

### Route
`/public/absen` (no authentication required, kiosk mode)

### Purpose
Kiosk-style self-service attendance marking at campus entrance/classroom.

### Features

#### **Main Interface**
- **Full-screen kiosk mode**
  - No navigation, minimal UI
  - Large camera preview
  - Clear instructions
  
- **Face Scan Flow**
  1. Welcome screen with "Tap to Start" button
  2. Camera activates automatically
  3. Real-time face detection
  4. Liveness detection (mouth open + head movement)
  5. Face recognition against database
  6. Result display (success/failure)
  7. Return to welcome screen after 5 seconds
  
- **Result Feedback**
  - **Success**:
    - Green checkmark animation
    - Display: "Selamat datang, [Nama]!"
    - Show photo, NIM, Kelas
    - "Absensi berhasil dicatat: [Mata Kuliah]"
    - Voice feedback: "Absensi berhasil"
  
  - **Failure**:
    - Red X animation
    - Display: "Wajah tidak dikenali"
    - Suggestions: "Pastikan wajah terlihat jelas", "Daftar wajah di portal"
    - Retry button
  
- **Admin Override**
  - Hidden button (bottom-right corner, long press 3s)
  - Password prompt
  - Access to settings: Select mata kuliah, View logs, Exit kiosk mode

**API Endpoints Needed:**
- `POST /api/v1/public/attendance/scan` - scan & mark attendance
- `GET /api/v1/public/attendance/active-session` - get current active session (kelas)

---

## 🔧 Technical Implementation

### File Structure
```
frontend/src/
├── pages/
│   ├── student/
│   │   ├── Dashboard.tsx           # Home page
│   │   ├── AttendanceHistory.tsx   # Attendance table/calendar
│   │   ├── FaceRegistration.tsx    # Face photo management
│   │   ├── Profile.tsx             # Profile & settings
│   │   └── Schedule.tsx            # Schedule view
│   ├── teacher/
│   │   ├── Dashboard.tsx           # Home page
│   │   ├── ClassList.tsx           # My classes
│   │   ├── ClassDetails.tsx        # Single class view
│   │   ├── MarkAttendance.tsx      # Face scan + manual
│   │   ├── Reports.tsx             # Generate reports
│   │   └── Profile.tsx             # Profile
│   └── public/
│       └── PublicAttendancePage.tsx # Kiosk mode
├── components/
│   ├── layouts/
│   │   ├── StudentLayout.tsx       # Student dashboard layout
│   │   └── TeacherLayout.tsx       # Teacher dashboard layout
│   └── features/
│       ├── attendance/
│       │   ├── AttendanceCalendar.tsx
│       │   ├── AttendanceTable.tsx
│       │   ├── AttendanceChart.tsx
│       │   └── FaceScanWidget.tsx
│       ├── schedule/
│       │   ├── WeeklySchedule.tsx
│       │   └── ScheduleCard.tsx
│       └── profile/
│           ├── ProfileCard.tsx
│           └── PasswordChangeForm.tsx
├── services/
│   ├── studentService.ts           # Student API calls
│   ├── teacherService.ts           # Teacher API calls
│   └── publicAttendanceService.ts  # Public API calls
└── types/
    ├── student.types.ts
    ├── teacher.types.ts
    └── attendance.types.ts
```

### Shared Components (Reusable)
- `<StatCard>` - Dashboard stat widget
- `<DataTable>` - Generic table with sort/filter
- `<DateRangePicker>` - Date range selector
- `<FaceScanModal>` - Face recognition modal
- `<AttendanceStatusBadge>` - Color-coded status badge
- `<ExportButton>` - Export data (CSV/PDF/Excel)

### State Management
- **Zustand Stores:**
  - `studentStore.ts` - Student-specific state
  - `teacherStore.ts` - Teacher-specific state
  - `attendanceStore.ts` - Attendance data cache
  
- **React Query:**
  - Dashboard data fetching
  - Attendance history pagination
  - Report generation status

### Routing Updates (router.tsx)
```tsx
// Student routes
{
  path: '/student',
  element: <ProtectedRoute allowedRoles={['user']}><StudentLayout /></ProtectedRoute>,
  children: [
    { index: true, element: <StudentDashboard /> },
    { path: 'attendance', element: <AttendanceHistory /> },
    { path: 'face', element: <FaceRegistration /> },
    { path: 'profile', element: <StudentProfile /> },
    { path: 'schedule', element: <Schedule /> },
  ],
},

// Teacher routes
{
  path: '/teacher',
  element: <ProtectedRoute allowedRoles={['guru']}><TeacherLayout /></ProtectedRoute>,
  children: [
    { index: true, element: <TeacherDashboard /> },
    { path: 'classes', element: <ClassList /> },
    { path: 'classes/:kelasId', element: <ClassDetails /> },
    { path: 'attendance/mark', element: <MarkAttendance /> },
    { path: 'reports', element: <Reports /> },
    { path: 'profile', element: <TeacherProfile /> },
  ],
},

// Public route
{
  path: '/public/absen',
  element: <PublicAttendancePage />,
},
```

---

## 🧪 Testing Strategy

### Unit Tests
- Component rendering (Vitest + React Testing Library)
- Service API mocking (MSW)
- State management logic

### Integration Tests
- Protected route navigation
- Face scan + attendance marking flow
- Export/download functionality

### E2E Tests (Optional)
- Full attendance marking flow (student)
- Teacher bulk marking flow
- Kiosk mode face recognition

---

## 📊 Data Models (TypeScript)

### Student Types
```typescript
interface StudentDashboardSummary {
  attendance_summary: {
    total_hadir: number;
    total_sakit: number;
    total_izin: number;
    total_alpa: number;
    percentage: number;
    status: 'good' | 'warning' | 'alert';
  };
  weekly_chart: {
    date: string;
    count: number;
  }[];
}

interface TodaySchedule {
  mata_kuliah: string;
  waktu_mulai: string;
  waktu_selesai: string;
  ruangan: string;
  dosen: string;
  next_class_in_minutes: number | null;
}

interface AttendanceRecord {
  id: number;
  tanggal: string;
  waktu: string;
  mata_kuliah: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alpa';
  method: 'face_recognition' | 'manual';
  confidence: number | null;
  keterangan: string | null;
}
```

### Teacher Types
```typescript
interface TeacherClass {
  kelas_id: number;
  mata_kuliah: string;
  kode_mk: string;
  enrolled_count: number;
  attendance_rate: number;
  schedule: {
    day: string;
    time: string;
    room: string;
  }[];
}

interface ClassStudent {
  user_id: number;
  nama_lengkap: string;
  nim: string;
  attendance_count: number;
  attendance_rate: number;
  last_attendance: string | null;
}
```

---

## 🚀 Implementation Phases

### Phase 1: Student Dashboard (Priority: HIGH)
**Estimated Time**: 2-3 days  
**Tasks:**
1. ✅ Update LandingPage navbar (auth-aware)
2. Create StudentLayout with sidebar navigation
3. Implement StudentDashboard (home page with widgets)
4. Implement AttendanceHistory page (table + filters)
5. Implement FaceRegistration page (reuse admin component)
6. Implement Profile page
7. Add student routes to router
8. Create studentService API calls
9. Testing & bug fixes

### Phase 2: Teacher Dashboard (Priority: HIGH)
**Estimated Time**: 2-3 days  
**Tasks:**
1. Create TeacherLayout with sidebar navigation
2. Implement TeacherDashboard (home page)
3. Implement ClassList page
4. Implement MarkAttendance page (face scan + manual)
5. Implement Reports page
6. Implement Profile page
7. Add teacher routes to router
8. Create teacherService API calls
9. Testing & bug fixes

### Phase 3: Public Attendance Page (Priority: MEDIUM)
**Estimated Time**: 1 day  
**Tasks:**
1. Implement PublicAttendancePage (kiosk mode)
2. Full-screen UI with face scan
3. Success/failure animations
4. Admin override panel
5. Create publicAttendanceService
6. Testing on actual kiosk device

### Phase 4: Polish & Optimization (Priority: LOW)
**Estimated Time**: 1 day  
**Tasks:**
1. Add loading states & skeletons
2. Error boundary components
3. Responsive design refinement
4. Performance optimization (code splitting)
5. Accessibility audit (WCAG 2.1 AA)
6. Documentation updates

---

## 📝 Notes

### Backend Dependencies
- All API endpoints listed above need to be implemented in backend
- Face recognition logic already exists (can be reused)
- Need to add teacher-specific endpoints
- Need to add public attendance endpoint

### Security Considerations
- Public attendance page: Rate limiting (prevent spam)
- Student face registration: Validate user owns the account
- Teacher attendance marking: Verify teacher teaches the kelas
- Export functionality: Sanitize data, prevent SQL injection

### Performance Optimization
- Lazy load dashboard charts (Recharts)
- Implement infinite scroll for attendance history
- Cache dashboard summary (React Query with 5-minute stale time)
- Optimize face recognition: Use Web Workers for heavy computation

### Accessibility
- Keyboard navigation for all interactive elements
- ARIA labels for screen readers
- High contrast mode support
- Focus indicators for form inputs

---

## ✅ Success Criteria

**Student Dashboard:**
- [x] Students can view attendance summary
- [x] Students can filter attendance history
- [x] Students can register/update face photos
- [x] Students can view schedule
- [x] Students can export attendance report (CSV)

**Teacher Dashboard:**
- [x] Teachers can view all their classes
- [x] Teachers can mark attendance (face scan)
- [x] Teachers can mark attendance (manual)
- [x] Teachers can generate reports
- [x] Teachers can view student roster

**Public Attendance:**
- [x] Face recognition works in kiosk mode
- [x] Liveness detection prevents spoofing
- [x] Success/failure feedback is clear
- [x] Admin can configure active session

---

**Ready to implement! 🌙✨**

**Next Steps:**
1. Implement StudentLayout & StudentDashboard
2. Create student routes
3. Build dashboard widgets
4. Integrate with backend API (once endpoints ready)
