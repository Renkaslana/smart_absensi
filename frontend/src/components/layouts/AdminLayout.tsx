import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';

const AdminLayout: React.FC = () => {
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
      icon: '📊',
    },
    {
      name: 'Manajemen Siswa',
      path: '/admin/students',
      icon: '👥',
    },
    {
      name: 'Laporan Kehadiran',
      path: '/admin/attendance',
      icon: '📋',
    },
    {
      name: 'Pengaturan',
      path: '/admin/settings',
      icon: '⚙️',
    },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary-800 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-primary-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold">FahrenCenter</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-primary-700"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          {sidebarOpen && (
            <p className="text-xs text-primary-300 mt-1">Admin Panel</p>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-primary-100 hover:bg-primary-700'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-primary-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-lg font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-xs text-primary-300 truncate">{user?.nim}</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="w-full mt-3 px-4 py-2 bg-danger-500 hover:bg-danger-600 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              {menuItems.find((item) => isActivePath(item.path))?.name || 'Admin'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
