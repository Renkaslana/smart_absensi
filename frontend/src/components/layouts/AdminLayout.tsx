import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import { AdminSidebar } from '../features/admin/AdminSidebar';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout berhasil');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      name: 'Manajemen Siswa',
      path: '/admin/students',
    },
    {
      name: 'Laporan Kehadiran',
      path: '/admin/attendance',
    },
    {
      name: 'Pengaturan',
      path: '/admin/settings',
    },
  ];

  const getCurrentPageName = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem?.name || 'Admin Panel';
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50">
      {/* Modern Sidebar Component */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userName={user?.name || 'Admin'}
        userNim={user?.nim || 'N/A'}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Modern Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {getCurrentPageName()}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Welcome back, {user?.name}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Administrator
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
