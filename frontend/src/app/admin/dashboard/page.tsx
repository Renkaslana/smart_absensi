'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  Clock,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowRight,
  Camera,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface DashboardData {
  overview: {
    total_users: number;
    total_students: number;
    total_admins: number;
    users_with_face: number;
    users_without_face: number;
    face_registration_rate: number;
    total_classes: number;
  };
  attendance: {
    today_count: number;
    total_students: number;
    attendance_rate_today: number;
    total_absensi: number;
    daily_summary: Array<{ date: string; count: number }>;
    weekly_summary: Array<{ week: string; count: number }>;
    by_kelas: Array<{ kelas: string; count: number }>;
  };
  recent_attendance: Array<{
    id: number;
    name: string;
    nim: string;
    kelas: string;
    timestamp: string;
    confidence: number;
    status: string;
  }>;
  classes: string[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getDashboard();
      setData(response.data);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.detail || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data for daily attendance
  const dailyChartData = {
    labels: data?.attendance.daily_summary?.slice(0, 7).reverse().map(d => 
      format(new Date(d.date), 'dd MMM', { locale: id })
    ) || [],
    datasets: [
      {
        label: 'Kehadiran',
        data: data?.attendance.daily_summary?.slice(0, 7).reverse().map(d => d.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Chart data for class distribution
  const classChartData = {
    labels: data?.attendance.by_kelas?.slice(0, 5).map(k => k.kelas) || [],
    datasets: [
      {
        data: data?.attendance.by_kelas?.slice(0, 5).map(k => k.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Gagal Memuat Data</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="btn bg-blue-600 text-white hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Total Students */}
        <motion.div variants={item} className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mahasiswa</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data?.overview.total_students || 0}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <UserCheck className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">{data?.overview.users_with_face || 0}</span>
            <span className="text-gray-500 ml-1">sudah registrasi wajah</span>
          </div>
        </motion.div>

        {/* Today's Attendance */}
        <motion.div variants={item} className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hadir Hari Ini</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data?.attendance.today_count || 0}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">dari {data?.attendance.total_students || 0} mahasiswa</span>
          </div>
        </motion.div>

        {/* Attendance Rate */}
        <motion.div variants={item} className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tingkat Kehadiran</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data?.attendance.attendance_rate_today || 0}%
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${data?.attendance.attendance_rate_today || 0}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Face Registration */}
        <motion.div variants={item} className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Belum Registrasi</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {data?.overview.users_without_face || 0}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Camera className="w-7 h-7 text-orange-600" />
            </div>
          </div>
          <Link 
            href="/admin/students?filter=no-face"
            className="mt-4 flex items-center text-sm text-orange-600 hover:text-orange-700"
          >
            Lihat daftar
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Chart */}
        <motion.div 
          variants={item}
          initial="hidden"
          animate="show"
          className="lg:col-span-2 card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Kehadiran 7 Hari Terakhir</h2>
            <Link 
              href="/admin/reports"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              Lihat Laporan
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="h-64">
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Class Distribution */}
        <motion.div 
          variants={item}
          initial="hidden"
          animate="show"
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Distribusi Kelas</h2>
          <div className="h-64 flex items-center justify-center">
            {data?.attendance.by_kelas && data.attendance.by_kelas.length > 0 ? (
              <Doughnut 
                data={classChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        boxWidth: 12,
                        padding: 16,
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="text-center text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Belum ada data kelas</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <motion.div 
          variants={item}
          initial="hidden"
          animate="show"
          className="card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Kehadiran Terbaru</h2>
            <Link 
              href="/admin/reports"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Lihat Semua
            </Link>
          </div>
          
          {data?.recent_attendance && data.recent_attendance.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.recent_attendance.slice(0, 5).map((record) => (
                <div key={record.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {record.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{record.name}</p>
                      <p className="text-sm text-gray-500">{record.nim} • {record.kelas}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(record.timestamp), 'HH:mm')}
                    </p>
                    <p className="text-xs text-gray-500">{record.confidence?.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada kehadiran hari ini</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          variants={item}
          initial="hidden"
          animate="show"
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Aksi Cepat</h2>
          
          <div className="space-y-3">
            <Link 
              href="/admin/students"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Kelola Mahasiswa</p>
                  <p className="text-sm text-gray-500">Tambah, edit, atau hapus data</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link 
              href="/admin/face-register"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Registrasi Wajah</p>
                  <p className="text-sm text-gray-500">Daftarkan wajah mahasiswa baru</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </Link>

            <Link 
              href="/admin/reports"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Laporan Absensi</p>
                  <p className="text-sm text-gray-500">Lihat statistik dan export data</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </Link>

            <Link 
              href="/admin/settings"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Calendar className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pengaturan</p>
                  <p className="text-sm text-gray-500">Konfigurasi sistem absensi</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
