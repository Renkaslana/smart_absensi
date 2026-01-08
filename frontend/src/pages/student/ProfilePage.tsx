import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Save,
  Edit,
  Eye,
  EyeOff,
  Award,
  BookOpen,
  Loader,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import { useStudentProfile, useUpdateProfile, useChangePassword } from '../../hooks/useStudent';

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🌙 Fetch profile from backend
  const { data: profileData, isLoading, error, refetch } = useStudentProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  // Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 🌙 Update form when profile data loaded
  useEffect(() => {
    if (profileData) {
      setPersonalInfo({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        birthDate: profileData.birth_date || '',
      });
    }
  }, [profileData]);

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        address: personalInfo.address,
        birth_date: personalInfo.birthDate,
      });
      toast.success('Profil berhasil diperbarui');
      setIsEditing(false);
      refetch(); // Refresh profile data
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.detail || 'Gagal memperbarui profil');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru tidak cocok');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      toast.success('Password berhasil diubah');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.detail || 'Gagal mengubah password');
    }
  };

  // 🌙 Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="text-gray-600">Memuat profil...</p>
      </div>
    );
  }

  // 🌙 Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl p-6 text-center">
        <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Gagal Memuat Profil</h3>
        <p className="text-red-700">Terjadi kesalahan saat mengambil data profil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-600 mt-1">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {profileData?.name.charAt(0).toUpperCase()}
                </div>

                {/* User Info */}
                <h2 className="mt-4 text-xl font-bold text-gray-900">{profileData?.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{profileData?.email}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">Siswa Aktif</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" />
                    <h2 className="text-xl font-bold text-gray-900">Informasi Pribadi</h2>
                  </div>
                  <button
                    onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : isEditing ? (
                      <>
                        <Save size={18} />
                        Simpan
                      </>
                    ) : (
                      <>
                        <Edit size={18} />
                        Edit
                      </>
                    )}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <User size={18} className="text-gray-400" />
                      <input
                        type="text"
                        value={personalInfo.name}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 outline-none disabled:bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Mail size={18} className="text-gray-400" />
                      <input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 outline-none disabled:bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      No. Telepon
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Phone size={18} className="text-gray-400" />
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 outline-none disabled:bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Calendar size={18} className="text-gray-400" />
                      <input
                        type="date"
                        value={personalInfo.birthDate}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, birthDate: e.target.value })
                        }
                        disabled={!isEditing}
                        className="flex-1 outline-none disabled:bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                    <div className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <MapPin size={18} className="text-gray-400 mt-0.5" />
                      <textarea
                        value={personalInfo.address}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, address: e.target.value })
                        }
                        disabled={!isEditing}
                        rows={2}
                        className="flex-1 outline-none resize-none disabled:bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Academic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Informasi Akademik</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">NIS</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData?.username}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Kelas</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData?.kelas}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Tahun Masuk</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData?.tahun_masuk}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Wali Kelas</p>
                    <p className="text-lg font-semibold text-gray-900">{profileData?.wali_kelas || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Ubah Password</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Saat Ini
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Lock size={18} className="text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="flex-1 outline-none"
                        placeholder="Masukkan password saat ini"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Baru
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Lock size={18} className="text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="flex-1 outline-none"
                        placeholder="Masukkan password baru"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Lock size={18} className="text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="flex-1 outline-none"
                        placeholder="Konfirmasi password baru"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending}
                    className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium rounded-xl transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changePasswordMutation.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader size={18} className="animate-spin" />
                        Mengubah Password...
                      </span>
                    ) : (
                      'Ubah Password'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-600 mt-1">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user?.name.charAt(0).toUpperCase()}
                </div>

                {/* User Info */}
                <h2 className="mt-4 text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                  <Award className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-700">Siswa Aktif</span>
                </div>

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">93.3%</p>
                    <p className="text-xs text-gray-600 mt-1">Kehadiran</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">42</p>
                    <p className="text-xs text-gray-600 mt-1">Hadir</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" />
                    <h2 className="text-xl font-bold text-gray-900">Informasi Pribadi</h2>
                  </div>
                  <button
                    onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <Save size={18} />
                        Simpan
                      </>
                    ) : (
                      <>
                        <Edit size={18} />
                        Edit
                      </>
                    )}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <User size={18} className="text-gray-400" />
                      <input
                        type="text"
                        value={personalInfo.name}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 outline-none disabled:bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Mail size={18} className="text-gray-400" />
                      <input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 outline-none disabled:bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      No. Telepon
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Phone size={18} className="text-gray-400" />
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 outline-none disabled:bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Calendar size={18} className="text-gray-400" />
                      <input
                        type="date"
                        value={personalInfo.birthDate}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, birthDate: e.target.value })
                        }
                        disabled={!isEditing}
                        className="flex-1 outline-none disabled:bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alamat</label>
                    <div className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <MapPin size={18} className="text-gray-400 mt-0.5" />
                      <textarea
                        value={personalInfo.address}
                        onChange={(e) =>
                          setPersonalInfo({ ...personalInfo, address: e.target.value })
                        }
                        disabled={!isEditing}
                        rows={2}
                        className="flex-1 outline-none resize-none disabled:bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Academic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Informasi Akademik</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">NIS</p>
                    <p className="text-lg font-semibold text-gray-900">{academicInfo.nis}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Kelas</p>
                    <p className="text-lg font-semibold text-gray-900">{academicInfo.class}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Tahun Masuk</p>
                    <p className="text-lg font-semibold text-gray-900">{academicInfo.entryYear}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">Wali Kelas</p>
                    <p className="text-lg font-semibold text-gray-900">{academicInfo.waliKelas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Ubah Password</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Saat Ini
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Lock size={18} className="text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="flex-1 outline-none"
                        placeholder="Masukkan password saat ini"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Baru
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Lock size={18} className="text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="flex-1 outline-none"
                        placeholder="Masukkan password baru"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg bg-white">
                      <Lock size={18} className="text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        className="flex-1 outline-none"
                        placeholder="Konfirmasi password baru"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="w-full px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium rounded-xl transition-all hover:shadow-lg"
                  >
                    Ubah Password
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
