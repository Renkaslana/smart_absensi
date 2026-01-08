import { useState } from 'react';
import { Search, Bell, Moon, Sun, Menu, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

export const Topbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex items-center justify-between h-16 px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Menu Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          aria-label="Toggle Sidebar"
          title="Toggle Sidebar"
        >
          <Menu size={20} className="text-neutral-700 dark:text-neutral-300" />
        </button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Cari siswa, kelas..."
            className={cn(
              'w-80 pl-10 pr-4 py-2 rounded-lg',
              'bg-neutral-100 dark:bg-neutral-700',
              'border border-transparent',
              'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent',
              'text-sm text-neutral-900 dark:text-neutral-100',
              'placeholder:text-neutral-500 dark:placeholder:text-neutral-400',
              'transition-all'
            )}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-600 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} />

        {/* Notifications */}
        <NotificationButton
          show={showNotifications}
          onToggle={() => setShowNotifications(!showNotifications)}
        />

        {/* User Menu */}
        <UserMenu
          user={user}
          show={showUserMenu}
          onToggle={() => setShowUserMenu(!showUserMenu)}
        />
      </div>
    </div>
  );
};

// Theme Toggle Button
interface ThemeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
}

const ThemeToggle = ({ darkMode, onToggle }: ThemeToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'hover:bg-neutral-100 dark:hover:bg-neutral-700'
      )}
      aria-label="Toggle Dark Mode"
      title="Toggle Dark Mode"
    >
      {darkMode ? (
        <Sun size={20} className="text-neutral-700 dark:text-neutral-300" />
      ) : (
        <Moon size={20} className="text-neutral-700 dark:text-neutral-300" />
      )}
    </button>
  );
};

// Notification Button
interface NotificationButtonProps {
  show: boolean;
  onToggle: () => void;
}

const NotificationButton = ({ show, onToggle }: NotificationButtonProps) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-neutral-100 dark:hover:bg-neutral-700'
        )}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={20} className="text-neutral-700 dark:text-neutral-300" />
        {/* Badge */}
        <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
      </button>

      {/* Dropdown */}
      {show && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-primary-700 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-600 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-600">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Notifikasi
            </h3>
          </div>
          <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Tidak ada notifikasi baru
          </div>
        </div>
      )}
    </div>
  );
};

// User Menu
interface UserMenuProps {
  user: any;
  show: boolean;
  onToggle: () => void;
}

const UserMenu = ({ user, show, onToggle }: UserMenuProps) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'hover:bg-neutral-100 dark:hover:bg-neutral-700'
        )}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {user?.name?.[0] || 'A'}
          </span>
        </div>
        <ChevronDown size={16} className="text-neutral-500" />
      </button>

      {/* Dropdown */}
      {show && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-primary-700 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-600 overflow-hidden">
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-600">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {user?.name}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {user?.email}
            </p>
          </div>
          <div className="p-2">
            <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-lg">
              Profil Saya
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg">
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
