import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Award,
  Activity,
  Sparkles
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactElement;
  badge?: number;
}

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userName: string;
  userNim: string;
  onLogout: () => void;
}

export const AdminSidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  userName, 
  userNim, 
  onLogout 
}: AdminSidebarProps) => {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Manajemen Siswa',
      path: '/admin/students',
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: 'Laporan Kehadiran',
      path: '/admin/attendance',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: 'Pengaturan',
      path: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <motion.aside
      initial={{ x: 0 }}
      animate={{ width: sidebarOpen ? 280 : 80 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-700/50"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      {/* Logo Section */}
      <div className="relative z-10 p-6 border-b border-slate-700/50">
        <motion.div 
          className="flex items-center justify-between"
          layout
        >
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    FahrenCenter
                  </h1>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Admin Panel
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 relative z-10 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const isActive = isActivePath(item.path);
            
            return (
              <motion.li
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={item.path}>
                  <motion.div
                    whileHover={{ x: sidebarOpen ? 5 : 0, scale: sidebarOpen ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                      }
                    `}
                  >
                    <div className={`${!sidebarOpen && 'mx-auto'}`}>
                      {item.icon}
                    </div>
                    
                    <AnimatePresence mode="wait">
                      {sidebarOpen && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between flex-1"
                        >
                          <span className="font-medium text-sm">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-xs font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isActive && !sidebarOpen && (
                      <motion.div
                        layoutId="activeDot"
                        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.li>
            );
          })}
        </ul>

        {/* Quick Stats (when expanded) */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-semibold text-slate-300">System Status</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">API</span>
                  <span className="flex items-center gap-1 text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Database</span>
                  <span className="flex items-center gap-1 text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    Connected
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700/50 relative z-10">
        <motion.div layout className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="relative"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold shadow-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
          </motion.div>
          
          <AnimatePresence mode="wait">
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="font-semibold text-sm truncate text-white">{userName}</p>
                <p className="text-xs text-slate-400 truncate">{userNim}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <AnimatePresence>
          {sidebarOpen && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="w-full mt-3 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
