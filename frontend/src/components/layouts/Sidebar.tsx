import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  children: ReactNode;
  className?: string;
  collapsed?: boolean;
}

export const Sidebar = ({
  children,
  className,
  collapsed = false,
}: SidebarProps) => {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-custom',
        'bg-white dark:bg-primary-600',
        'border-r border-neutral-200 dark:border-neutral-700',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {children}
    </aside>
  );
};

/* ================= HEADER ================= */

interface SidebarHeaderProps {
  children: ReactNode;
  className?: string;
}

export const SidebarHeader = ({
  children,
  className,
}: SidebarHeaderProps) => {
  return (
    <div
      className={cn(
        'flex h-16 items-center px-4',
        'border-b border-neutral-200 dark:border-neutral-700/50',
        className
      )}
    >
      {children}
    </div>
  );
};

/* ================= CONTENT ================= */

interface SidebarContentProps {
  children: ReactNode;
  className?: string;
}

export const SidebarContent = ({
  children,
  className,
}: SidebarContentProps) => {
  return (
    <nav
      className={cn(
        'flex-1 overflow-y-auto overflow-x-hidden px-3 py-4',
        'scrollbar-thin scrollbar-thumb-neutral-400 scrollbar-track-transparent',
        className
      )}
    >
      {children}
    </nav>
  );
};

/* ================= FOOTER ================= */

interface SidebarFooterProps {
  children: ReactNode;
  className?: string;
}

export const SidebarFooter = ({
  children,
  className,
}: SidebarFooterProps) => {
  return (
    <div
      className={cn(
        'border-t border-neutral-200 dark:border-neutral-700/50',
        className
      )}
    >
      {children}
    </div>
  );
};

/* ================= GROUP ================= */

interface SidebarGroupProps {
  children: ReactNode;
  label?: string;
  className?: string;
}

export const SidebarGroup = ({
  children,
  label,
  className,
}: SidebarGroupProps) => {
  return (
    <div className={cn('mb-4', className)}>
      {label && (
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
};

/* ================= ITEM ================= */

interface SidebarItemProps {
  icon?: ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
  className?: string;
  collapsed?: boolean;
}

export const SidebarItem = ({
  icon,
  label,
  active = false,
  badge,
  onClick,
  className,
  collapsed = false,
}: SidebarItemProps) => {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5',
        'text-sm font-medium transition-all duration-200',
        'hover:bg-neutral-100 dark:hover:bg-white/10',
        active
          ? 'bg-accent-500 text-white shadow-sm'
          : 'text-neutral-700 dark:text-neutral-100',
        collapsed && 'justify-center px-2',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}

      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{label}</span>
          {badge && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-coral-500 px-1.5 text-xs font-semibold text-white">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
};
