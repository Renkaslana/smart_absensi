'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  Home,
  Camera,
  Scan,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
} from 'lucide-react';

const adminNavItems = [
  { href: '/', icon: Home, label: 'Beranda' },
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/check=wajah', icon: Camera, label: 'Mulai Absensi Wajah' },
  { href: '/admin/students', icon: Users, label: 'Data Mahasiswa' },
  { href: '/admin/face-register', icon: Camera, label: 'Registrasi Wajah' },
  { href: '/admin/reports', icon: FileBarChart, label: 'Laporan' },
  { href: '/admin/settings', icon: Settings, label: 'Pengaturan' },
];

interface Props {
  pathname: string | null;
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export default function AdminSidebar({
  pathname,
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  onLogout,
}: Props) {
  const base = 'fixed top-0 left-0 h-full z-50 bg-primary-900 transition-all duration-300';
  const width = isCollapsed ? 'w-20' : 'w-64';
  const translate = isOpen ? 'translate-x-0' : '-translate-x-full';

  return (
    <aside className={`${base} ${width} ${translate} lg:translate-x-0`}>
      {/* ===== Header ===== */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-semibold text-white tracking-tight">
              Admin Panel
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="lg:hidden text-white/70 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>


       {/* ===== Navigation ===== */}
      <nav className="px-3 py-4 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`
                group relative flex items-center gap-3
                px-3 py-3 rounded-xl
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200
                  group-hover:scale-110`}
              />

              {!isCollapsed && (
                <span className="text-sm font-medium">
                  {item.label}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ===== Footer ===== */}
      <div className="absolute bottom-4 left-3 right-3 space-y-2">
        <button
          onClick={onToggleCollapse}
          className={`
            flex items-center gap-2
            px-3 py-2 w-full rounded-xl
            text-white/70 hover:text-white
            hover:bg-white/5 transition
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Sembunyikan</span>
            </>
          )}
        </button>

        <button
          onClick={onLogout}
          className={`
            flex items-center gap-3
            px-3 py-2 w-full rounded-xl
            text-red-400 hover:text-red-300
            hover:bg-red-500/10 transition
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Keluar</span>
          )}
        </button>
      </div>
    </aside>
  );
}
