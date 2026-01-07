'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff,
  Save,
  Camera,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: '',
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotif: true,
    absensiReminder: true,
    weeklyReport: false,
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'password', label: 'Keamanan', icon: Lock },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
    { id: 'privacy', label: 'Privasi', icon: Shield },
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API call to update profile
      setSuccessMessage('Profil berhasil diperbarui');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Gagal memperbarui profil');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('Password baru tidak cocok');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setErrorMessage('Password minimal 6 karakter');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      setSuccessMessage('Password berhasil diubah');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Gagal mengubah password';
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSubmit = async () => {
    try {
      // API call to update notifications
      setSuccessMessage('Pengaturan notifikasi berhasil disimpan');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Gagal menyimpan pengaturan');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-primary-900">Pengaturan</h1>
        <p className="text-neutral-600 mt-1">
          Kelola akun dan preferensi Anda
        </p>
      </motion.div>

      {/* Alert Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700">{successMessage}</p>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{errorMessage}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <nav className="card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">Informasi Profil</h2>
              
              {/* Avatar */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-600" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{user?.name}</p>
                  <p className="text-sm text-neutral-500">NIM: {user?.nim}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="+62..."
                  />
                </div>

                <div className="pt-4">
                  <button type="submit" className="btn-primary flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Settings */}
          {activeTab === 'password' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">Ubah Password</h2>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="input-field"
                  />
                </div>

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-primary-900 mb-2">Syarat Password:</h4>
                  <ul className="text-sm text-primary-700 space-y-1">
                    <li>• Minimal 6 karakter</li>
                  </ul>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span>{isLoading ? 'Menyimpan...' : 'Ubah Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">Pengaturan Notifikasi</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Notifikasi Email</p>
                    <p className="text-sm text-neutral-500">Terima notifikasi melalui email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotif}
                      onChange={(e) =>
                        setNotifications({ ...notifications, emailNotif: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Pengingat Absensi</p>
                    <p className="text-sm text-neutral-500">Ingatkan untuk absensi setiap hari</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.absensiReminder}
                      onChange={(e) =>
                        setNotifications({ ...notifications, absensiReminder: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Laporan Mingguan</p>
                    <p className="text-sm text-neutral-500">Terima laporan kehadiran mingguan</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.weeklyReport}
                      onChange={(e) =>
                        setNotifications({ ...notifications, weeklyReport: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleNotificationSubmit}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-primary-900 mb-6">Pengaturan Privasi</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <h3 className="font-medium text-neutral-900 mb-2">Data Wajah</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Data wajah Anda disimpan secara aman dan hanya digunakan untuk verifikasi
                    kehadiran.
                  </p>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                    Hapus Data Wajah
                  </button>
                </div>

                <div className="p-4 bg-neutral-50 rounded-lg">
                  <h3 className="font-medium text-neutral-900 mb-2">Riwayat Aktivitas</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    Hapus semua riwayat aktivitas dan log absensi Anda.
                  </p>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                    Hapus Riwayat
                  </button>
                </div>

                <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-medium text-red-900 mb-2">Hapus Akun</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara
                    permanen.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                    Hapus Akun Saya
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
