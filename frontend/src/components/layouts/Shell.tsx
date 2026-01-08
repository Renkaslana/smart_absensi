import { type ReactNode, useState } from 'react';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface ShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export const Shell = ({ children, sidebar, className }: ShellProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-primary-800">
      {/* Sidebar */}
      {sidebar && (
        <Sidebar collapsed={sidebarCollapsed}>
          {sidebar}
        </Sidebar>
      )}

      {/* Topbar */}
      <Topbar
        onMenuClick={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64',
          className
        )}
      >
        {children}
      </main>
    </div>
  );
};

interface ShellContentProps {
  children: ReactNode;
  className?: string;
}

export const ShellContent = ({ children, className }: ShellContentProps) => {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
};

interface ShellHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const ShellHeader = ({ title, description, actions, className }: ShellHeaderProps) => {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 md:text-3xl font-display">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
