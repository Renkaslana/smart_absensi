import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Selamat datang di Admin Panel FahrenCenter
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Siswa</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_students || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students with Face */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Wajah Terdaftar</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.students_with_face || 0}
                </p>
                <p className="text-xs text-success-600 mt-1">
                  {stats?.face_registration_percentage.toFixed(1)}% dari total
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">😊</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today Present */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hadir Hari Ini</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.today_present || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tidak hadir: {stats?.today_absent || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Total */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bulan Ini</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.month_total_attendance || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Kehadiran</p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statistik Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Total Kehadiran</span>
                <span className="font-semibold text-gray-900">
                  {stats?.today_statistics.total_present || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600">Siswa Unik</span>
                <span className="font-semibold text-gray-900">
                  {stats?.today_statistics.unique_students || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Rata-rata Confidence</span>
                <span className="font-semibold text-success-600">
                  {stats?.today_statistics.average_confidence.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Face Registration Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Registrasi Wajah</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Sudah Terdaftar</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats?.students_with_face} / {stats?.total_students}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-success-500 h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats?.face_registration_percentage || 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {stats?.face_registration_percentage.toFixed(1)}% siswa sudah
                  mendaftarkan wajah
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Status:</p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      Terdaftar ({stats?.students_with_face})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      Belum (
                      {(stats?.total_students || 0) - (stats?.students_with_face || 0)}
                      )
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/students"
              className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">👥</span>
                <div>
                  <p className="font-semibold text-gray-900">Kelola Siswa</p>
                  <p className="text-xs text-gray-600">
                    Tambah, edit, atau hapus data siswa
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/admin/attendance"
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div>
                  <p className="font-semibold text-gray-900">Laporan Kehadiran</p>
                  <p className="text-xs text-gray-600">
                    Lihat dan export laporan kehadiran
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/admin/settings"
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                <div>
                  <p className="font-semibold text-gray-900">Pengaturan</p>
                  <p className="text-xs text-gray-600">
                    Konfigurasi sistem dan pengaturan
                  </p>
                </div>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
