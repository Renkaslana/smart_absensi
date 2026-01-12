import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Moon, Sun, Menu, ChevronDown, User, LogOut, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { usePopupController } from '../../hooks/usePopupController';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

type ActivePopup = 'notifications' | 'user' | 'search';

export const Topbar = () => {
    const [darkMode, setDarkMode] = useState(() => {
        // Load from localStorage
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.documentElement.classList.add('dark');
            return true;
        }
        return false;
    });
    const [searchQuery, setSearchQuery] = useState('');
    const { activePopup, toggle, close, containerRef } =
        usePopupController<ActivePopup>();

    const toggleSidebar = useUIStore((state) => state.toggleSidebar);
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        
        // Save to localStorage
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        
        // Toggle dark class
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const location = useLocation();

    useEffect(() => {
        close();
    }, [location.pathname]);

    // Keyboard shortcut for search (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="text"][placeholder*="Cari"]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Search functionality with debounce
    const { data: searchResults, isLoading: searchLoading } = useQuery({
        queryKey: ['search', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return null;
            const response = await adminService.getStudents({ 
                skip: 0,
                limit: 5,
                search: searchQuery 
            });
            return response;
        },
        enabled: searchQuery.length > 0,
        staleTime: 1000 * 30, // 30 seconds
    });

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) { // Show dropdown for quick preview
            toggle('search');
        } else {
            close();
        }
    };

    const handleSelectUser = (userId: number) => {
        navigate(`/admin/students`);
        setSearchQuery('');
        close();
    };

    const handleViewAllResults = () => {
        if (searchQuery.trim()) {
            navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
            close();
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleViewAllResults();
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
                <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        placeholder="Cari siswa, kelas..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                                handleViewAllResults();
                            }
                        }}
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
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => handleSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded"
                        >
                            <X size={14} className="text-neutral-500" />
                        </button>
                    )}

                    {/* Search Results Dropdown */}
                    {activePopup === 'search' && searchQuery && searchQuery.length > 2 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-primary-700 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-600 overflow-hidden z-50">
                            <div className="p-2 border-b border-neutral-200 dark:border-neutral-600">
                                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                    Hasil Pencarian
                                </p>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {searchLoading ? (
                                    <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                        Mencari...
                                    </div>
                                ) : searchResults?.data && searchResults.data.length > 0 ? (
                                    <div className="py-1">
                                        {searchResults.data.map((item: any) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelectUser(item.id)}
                                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors text-left"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-bold text-xs">
                                                        {item.name?.[0] || 'U'}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                        {item.nim} {item.kelas ? `• ${item.kelas}` : ''}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                        {/* View All Button */}
                                        <button
                                            onClick={handleViewAllResults}
                                            className="w-full px-4 py-3 text-center text-sm font-medium text-accent-600 dark:text-accent-400 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors border-t border-neutral-200 dark:border-neutral-600"
                                        >
                                            Lihat Semua Hasil untuk "{searchQuery}"
                                        </button>
                                        {searchResults.total > 5 && (
                                            <div className="px-4 py-2 text-xs text-center text-neutral-500 dark:text-neutral-400">
                                                {searchResults.total - 5}+ hasil lainnya
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                        Tidak ada hasil untuk "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <ThemeToggle darkMode={darkMode} onToggle={toggleDarkMode} />

                <div ref={containerRef} className="flex items-center gap-2">
                    {/* Notification Button */}
                    <NotificationButton
                        show={activePopup === 'notifications'}
                        onToggle={() => toggle('notifications')}
                    />

                    {/* User Menu */}
                    <UserMenu
                        user={user}
                        show={activePopup === 'user'}
                        onToggle={() => toggle('user')}
                    />
                </div>

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
    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => adminService.getDashboardStats(),
        staleTime: 1000 * 60, // 1 minute
    });

    // Generate notifications based on dashboard data
    const notifications = [];
    
    if (dashboardData) {
        // Low attendance alert
        const attendanceToday = dashboardData.today_present || 0;
        const totalStudents = dashboardData.total_students || 0;
        const attendanceRate = totalStudents > 0 ? (attendanceToday / totalStudents) * 100 : 0;
        
        if (attendanceRate < 50 && totalStudents > 0) {
            notifications.push({
                id: 'low-attendance',
                type: 'warning',
                title: 'Kehadiran Rendah',
                message: `Hanya ${Math.round(attendanceRate)}% siswa hadir hari ini`,
                time: 'Hari ini',
            });
        }

        // Face registration alert
        const withoutFace = totalStudents - (dashboardData.students_with_face || 0);
        if (withoutFace > 0) {
            notifications.push({
                id: 'no-face',
                type: 'info',
                title: 'Registrasi Wajah',
                message: `${withoutFace} siswa belum registrasi wajah`,
                time: 'Hari ini',
            });
        }

        // System status
        notifications.push({
            id: 'system-ok',
            type: 'success',
            title: 'Sistem Normal',
            message: 'Semua sistem berjalan dengan baik',
            time: 'Baru saja',
        });
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            case 'success':
                return '✅';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'warning':
                return 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20';
            case 'info':
                return 'text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-900/20';
            case 'success':
                return 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20';
            default:
                return 'text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/20';
        }
    };

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
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-white text-xs font-bold">
                        {notifications.length}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {show && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-primary-700 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-600 overflow-hidden z-50">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-600 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                            Notifikasi
                        </h3>
                        {notifications.length > 0 && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {notifications.length} baru
                            </span>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-neutral-200 dark:divide-neutral-600">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-600/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={cn(
                                                'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                                                getNotificationColor(notif.type)
                                            )}>
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                                    {notif.title}
                                                </p>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                                                    {notif.time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-600 flex items-center justify-center">
                                    <Bell size={24} className="text-neutral-400" />
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Tidak ada notifikasi baru
                                </p>
                            </div>
                        )}
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
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfile = () => {
        navigate('/admin/settings');
        onToggle();
    };

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
                <ChevronDown size={16} className="text-neutral-500 dark:text-neutral-400" />
            </button>

            {/* Dropdown */}
            {show && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-primary-700 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-600 overflow-hidden z-50">
                    <div className="p-3 border-b border-neutral-200 dark:border-neutral-600">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                            {user?.name}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {user?.email}
                        </p>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={handleProfile}
                            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                        >
                            <User size={16} />
                            <span>Profil Saya</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                        >
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
