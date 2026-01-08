import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  School, 
  Settings, 
  LogOut,
  Camera
} from 'lucide-react';
import { Shell, ShellContent } from './Shell';
import { 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarItem 
} from './Sidebar';

const AdminLayout = () => {
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
      toast.error('Gagal logout');
    }
  };

  const mainMenuItems = [
    {
      label: 'Dashboard',
      path: '/admin/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Manajemen Siswa',
      path: '/admin/students',
      icon: <Users size={20} />,
    },
    {
      label: 'Manajemen Kelas',
      path: '/admin/classrooms',
      icon: <School size={20} />,
    },
    {
      label: 'Laporan Kehadiran',
      path: '/admin/attendance',
      icon: <ClipboardCheck size={20} />,
    },
  ];

  const systemMenuItems = [
    {
      label: 'Pengaturan',
      path: '/admin/settings',
      icon: <Settings size={20} />,
    },
  ];

  const sidebar = (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-white">
            <Camera size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">FahrenCenter</span>
            <span className="text-xs text-neutral-300">Smart Attendance</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup label="Main Menu">
          {mainMenuItems.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </SidebarGroup>

        <SidebarGroup label="System">
          {systemMenuItems.map((item) => (
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
        <div className="flex items-center gap-3 mb-3 px-2 py-2 rounded-lg bg-white/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || 'Admin'}
            </p>
            <p className="text-xs text-neutral-300 truncate">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-danger-500 hover:text-white"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </>
  );

  return (
    <Shell sidebar={sidebar}>
      <ShellContent>
        <Outlet />
      </ShellContent>
    </Shell>
  );
};

export default AdminLayout;
