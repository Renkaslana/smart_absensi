import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shell } from './Shell';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarItem } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import {
  LayoutDashboard,
  Users,
  School,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      path: '/admin/dashboard',
    },
    {
      icon: <Users size={20} />,
      label: 'Siswa & Guru',
      path: '/admin/students',
    },
    {
      icon: <School size={20} />,
      label: 'Kelas',
      path: '/admin/classrooms',
    },
    {
      icon: <ClipboardList size={20} />,
      label: 'Kehadiran',
      path: '/admin/attendance',
    },
    {
      icon: <Settings size={20} />,
      label: 'Pengaturan',
      path: '/admin/settings',
    },
  ];

  const sidebar = (
    <Sidebar collapsed={sidebarCollapsed}>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">FC</span>
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                FahrenCenter
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Admin Portal
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup label="Menu Utama">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">
                {user?.name?.[0] || 'A'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Logout"
          >
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );

  return (
    <Shell sidebar={sidebar} topbar={<Topbar />}>
      <Outlet />
    </Shell>
  );
};

export default AdminLayout;
