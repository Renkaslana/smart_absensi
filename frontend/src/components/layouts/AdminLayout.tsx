import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
} from './Sidebar';
import { Shell } from './Shell';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

import {
  LayoutDashboard,
  Users,
  School,
  ClipboardList,
  Settings,
  ScanFace,
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
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <Users size={20} />, label: 'Siswa & Guru', path: '/admin/students' },
    { icon: <School size={20} />, label: 'Kelas', path: '/admin/classrooms' },
    { icon: <ClipboardList size={20} />, label: 'Kehadiran', path: '/admin/attendance' },
    { icon: <Settings size={20} />, label: 'Pengaturan', path: '/admin/settings' },
  ];

  const toolItems = [
    { icon: <ScanFace size={20} />, label: 'Test Absensi', path: '/admin/attendance-test' },
  ];

  const sidebar = (
    <Sidebar collapsed={sidebarCollapsed}>
      {/* ===== HEADER ===== */}
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
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

      {/* ===== CONTENT ===== */}
      <SidebarContent>
        <SidebarGroup label={!sidebarCollapsed ? 'Menu Utama' : undefined}>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              collapsed={sidebarCollapsed}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label={!sidebarCollapsed ? 'Tools' : undefined}>
          {toolItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              collapsed={sidebarCollapsed}
            />
          ))}
        </SidebarGroup>
      </SidebarContent>

      {/* ===== FOOTER (FIXED UX) ===== */}
      <SidebarFooter>
        <div
          className={cn(
            'py-3',
            sidebarCollapsed ? 'px-2' : 'px-4'
          )}
        >
          <div
            className={cn(
              'flex items-center mb-3',
              sidebarCollapsed ? 'justify-center' : 'gap-3'
            )}
            title={
              sidebarCollapsed
                ? `${user?.name ?? ''} • ${user?.email ?? ''}`
                : undefined
            }
          >
            <div
              className={cn(
                'rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center transition-all',
                sidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'
              )}
            >
              <span className="text-white font-bold text-sm">
                {user?.name?.[0] || 'A'}
              </span>
            </div>

            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              'text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20',
              sidebarCollapsed && 'justify-center px-2'
            )}
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
