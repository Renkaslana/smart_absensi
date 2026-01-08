import { Bell, Search, Menu, Moon, Sun } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TopbarProps {
  onMenuClick?: () => void;
  className?: string;
  sidebarCollapsed?: boolean;
}

export const Topbar = ({ onMenuClick, className, sidebarCollapsed = false }: TopbarProps) => {
  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white dark:bg-primary-700',
        'border-b border-neutral-200 dark:border-neutral-700',
        'transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64',
        className
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left: Menu & Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden md:flex items-center gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2">
            <Search size={18} className="text-neutral-400" />
            <input
              type="text"
              placeholder="Cari siswa, kelas, atau laporan..."
              className="w-64 bg-transparent text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none dark:text-neutral-200"
            />
            <kbd className="hidden lg:inline-block rounded bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

const ThemeToggle = () => {
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50"
      aria-label="Toggle theme"
    >
      <Sun size={20} className="hidden dark:block" />
      <Moon size={20} className="block dark:hidden" />
    </button>
  );
};

const NotificationButton = () => {
  return (
    <button
      className="relative rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50"
      aria-label="Notifications"
    >
      <Bell size={20} />
      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-coral-500 ring-2 ring-white dark:ring-primary-700" />
    </button>
  );
};

const UserMenu = () => {
  return (
    <div className="flex items-center gap-3 ml-2">
      <div className="hidden md:block text-right">
        <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-100">
          Admin User
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Administrator
        </div>
      </div>
      <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-semibold text-white ring-2 ring-white dark:ring-primary-700 hover:ring-accent-300 transition-all">
        AU
      </button>
    </div>
  );
};

interface TopbarBreadcrumbProps {
  items: Array<{ label: string; href?: string }>;
  className?: string;
}

export const TopbarBreadcrumb = ({ items, className }: TopbarBreadcrumbProps) => {
  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-neutral-400">/</span>
          )}
          {item.href ? (
            <a
              href={item.href}
              className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              {item.label}
            </a>
          ) : (
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
