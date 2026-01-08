import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../stores/uiStore';

interface ShellProps {
  children: ReactNode;
  sidebar: ReactNode;
  topbar?: ReactNode;
}

export const Shell = ({ children, sidebar, topbar }: ShellProps) => {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-primary-900">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40',
          'bg-white dark:bg-primary-800 border-r border-neutral-200 dark:border-neutral-700',
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebar}
      </aside>

      {/* Main Area */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Topbar */}
        {topbar && (
          <header className="sticky top-0 z-30 bg-white dark:bg-primary-800 border-b border-neutral-200 dark:border-neutral-700">
            {topbar}
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

// ShellHeader component untuk konsistensi header di setiap page
interface ShellHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const ShellHeader = ({ title, description, actions }: ShellHeaderProps) => {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
};

// ShellContent untuk wrapping konten dengan spacing konsisten
interface ShellContentProps {
  children: ReactNode;
  className?: string;
}

export const ShellContent = ({ children, className }: ShellContentProps) => {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
};
