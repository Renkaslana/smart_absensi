import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import PublicLayout from './components/layouts/PublicLayout';
import AppLayout from './components/layouts/AppLayout';
import AdminLayout from './components/layouts/AdminLayout';
import StudentLayout from './components/layouts/StudentLayout';
import TeacherLayout from './components/layouts/TeacherLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import StudentRegistrationPage from './pages/public/StudentRegistrationPage';
import PublicAttendancePage from './pages/public/PublicAttendancePage_New';

// Student Pages
import Dashboard from './pages/student/Dashboard';
import AbsensiPage from './pages/student/AbsensiPage';
import RegisterFacePage from './pages/student/RegisterFacePage';
import ProfilePage from './pages/student/ProfilePage';
import SchedulePage from './pages/student/SchedulePage';
import AttendanceListPage from './pages/student/AttendanceListPage';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import MyClassesPage from './pages/teacher/MyClassesPage';
import TeacherProfilePage from './pages/teacher/ProfilePage';
import MarkAttendancePage from './pages/teacher/MarkAttendancePage';
import ReportsPage from './pages/teacher/ReportsPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StudentsPage from './pages/admin/StudentsPage';
import ClassroomsPage from './pages/admin/ClassroomsPage.tsx';
import StudentDetailPage from './pages/admin/StudentDetailPage';
import AttendancePage from './pages/admin/AttendancePage';
import AttendanceTestPage from './pages/admin/AttendanceTestPage';
import FaceRegistrationPage from './pages/admin/FaceRegistrationPage';
import SettingsPage from './pages/admin/SettingsPage';

// Protected Route Component
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'register/student',
        element: <StudentRegistrationPage />,
      },
      {
        path: 'public/absen',
        element: <PublicAttendancePage />,
      },
    ],
  },

  // Student Routes (Protected)
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['user']}>
        <StudentLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'attendance-list',
        element: <AttendanceListPage />,
      },
      {
        path: 'face',
        element: <RegisterFacePage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'schedule',
        element: <SchedulePage />,
      },
    ],
  },

  // Teacher Routes (Protected)
  {
    path: '/teacher',
    element: (
      <ProtectedRoute allowedRoles={['teacher']}>
        <TeacherLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <TeacherDashboard />,
      },
      {
        path: 'classes',
        element: <MyClassesPage />,
      },
      {
        path: 'mark-attendance',
        element: <MarkAttendancePage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'profile',
        element: <TeacherProfilePage />,
      },
    ],
  },

  // Admin Routes (Protected)
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'students',
        element: <StudentsPage />,
      },
      {
        path: 'classrooms',
        element: <ClassroomsPage />,
      },
      {
        path: 'students/:id',
        element: <StudentDetailPage />,
      },
      {
        path: 'students/:userId/face-registration',
        element: <FaceRegistrationPage />,
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'attendance-test',
        element: <AttendanceTestPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },

  // 404 Route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
