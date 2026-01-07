import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import PublicLayout from './components/layouts/PublicLayout';
import AppLayout from './components/layouts/AppLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import PublicAbsenPage from './pages/public/PublicAbsenPage';

// Student Pages
import Dashboard from './pages/student/Dashboard';
import AbsensiPage from './pages/student/AbsensiPage';
import RegisterFacePage from './pages/student/RegisterFacePage';
import HistoryPage from './pages/student/HistoryPage';
import ProfilePage from './pages/student/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import StudentsPage from './pages/admin/StudentsPage';
import StudentDetailPage from './pages/admin/StudentDetailPage';
import AttendancePage from './pages/admin/AttendancePage';
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
        path: 'public/absen',
        element: <PublicAbsenPage />,
      },
    ],
  },

  // Student Routes (Protected)
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['user', 'teacher']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'absen',
        element: <AbsensiPage />,
      },
      {
        path: 'register-face',
        element: <RegisterFacePage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
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
        path: 'students/:id',
        element: <StudentDetailPage />,
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
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
