'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  RefreshCw,
  GraduationCap,
  ClipboardList,
  Settings,
  Download
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
import { Bar, Doughnut } from 'react-chartjs-2';

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
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: { [key: string]: string } = {
    hadir: 'bg-green-100 text-green-700',
    terlambat: 'bg-yellow-100 text-yellow-700',
    tidak_hadir: 'bg-red-100 text-red-700',
    izin: 'bg-blue-100 text-blue-700',
    sakit: 'bg-purple-100 text-purple-700',
  };

  const labels: { [key: string]: string } = {
    hadir: 'Hadir',
    terlambat: 'Terlambat',
    tidak_hadir: 'Tidak Hadir',
    izin: 'Izin',
    sakit: 'Sakit',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.hadir}`}>
      {labels[status] || status}
    </span>
  );
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Simple: just fetch after mount
    const timer = setTimeout(() => {
      console.log('⏳ [admin/page] Fetching dashboard after mount...');
      fetchDashboardData();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchDashboardData = async () => {
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      console.log('🔑 [admin/page] Token in localStorage:', !!token);
      
      const response = await adminAPI.getDashboard();
      console.log('✅ [admin/page] Dashboard data loaded');
      setData(response.data);
    } catch (err: any) {
      console.error('❌ [admin/page] Dashboard fetch error:', err);
      setError(err.response?.data?.detail || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // 1. Chart data for daily attendance - Pake Optional Chaining di tiap level
  const dailyChartData = {
    labels: data?.attendance?.daily_summary?.slice(0, 7).reverse().map(d => 
      format(new Date(d.date), 'dd MMM', { locale: id })
    ) || [],
    datasets: [
      {
        label: 'Kehadiran',
        data: data?.attendance?.daily_summary?.slice(0, 7).reverse().map(d => d.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 0,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      },
    ],
  };

  // 2. Chart data for class distribution
  const classChartData = {
    labels: data?.attendance?.by_kelas?.slice(0, 5).map(k => k.kelas) || [],
    datasets: [
      {
        data: data?.attendance?.by_kelas?.slice(0, 5).map(k => k.count) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 0,
        hoverOffset: 4,
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
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.04)',
        },
        ticks: {
          font: { size: 11 },
          color: '#9ca3af',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#9ca3af',
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 mt-4">Memuat dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Gagal Memuat Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/reports"
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {/* Total Students */}
        <motion.div 
          variants={item} 
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Total Mahasiswa</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {data?.overview?.total_students ?? 0}
              </p>
              <div className="mt-3 flex items-center text-sm">
                <div className="flex items-center text-green-600">
                  <UserCheck className="w-4 h-4 mr-1" />
                  <span className="font-medium">{data?.overview?.users_with_face ?? 0}</span>
                </div>
                <span className="text-gray-400 mx-1">/</span>
                <div className="flex items-center text-orange-600">
                  <UserX className="w-4 h-4 mr-1" />
                  <span className="font-medium">{data?.overview?.users_without_face ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Today's Attendance */}
        <motion.div 
          variants={item} 
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Hadir Hari Ini</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {data?.attendance?.today_count ?? 0}
              </p>
              <p className="mt-3 text-sm text-gray-500">
                dari <span className="font-medium text-gray-700">{data?.attendance?.total_students ?? 0}</span> mahasiswa
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Attendance Rate */}
        <motion.div 
          variants={item} 
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Tingkat Kehadiran</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {data?.attendance?.attendance_rate_today ?? 0}%
              </p>
              <div className="mt-3 w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${data?.attendance?.attendance_rate_today ?? 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                />
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Face Registration */}
        <motion.div 
          variants={item} 
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Belum Registrasi Wajah</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {data?.overview?.users_without_face ?? 0}
              </p>
              <Link 
                href="/admin/students?filter=no-face"
                className="mt-3 inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Lihat daftar
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-200">
              <Camera className="w-7 h-7 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Kehadiran 7 Hari Terakhir</h2>
              <p className="text-sm text-gray-500 mt-0.5">Statistik kehadiran harian</p>
            </div>
            <Link 
              href="/admin/reports"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium"
            >
              Detail
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="h-72">
            {data?.attendance?.daily_summary?.length > 0 ? (
              <Bar data={dailyChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Belum ada data kehadiran</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Class Distribution */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Distribusi Kelas</h2>
            <p className="text-sm text-gray-500 mt-0.5">Kehadiran per kelas</p>
          </div>
          <div className="h-56 flex items-center justify-center">
            {data?.attendance?.by_kelas?.length > 0 ? (
              <Doughnut 
                data={classChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '65%',
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                      labels: {
                        boxWidth: 12,
                        padding: 16,
                        font: { size: 11 },
                      },
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      padding: 12,
                      cornerRadius: 8,
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Kehadiran Terbaru</h2>
              <p className="text-sm text-gray-500 mt-0.5">Aktivitas hari ini</p>
            </div>
            <Link 
              href="/admin/reports"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Lihat Semua
            </Link>
          </div>
          
          {data?.recent_attendance && data.recent_attendance.length > 0 ? (
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {data.recent_attendance?.slice(0, 8).map((record, index) => (
                  <motion.div 
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm">
                        {record.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{record.name}</p>
                        <p className="text-sm text-gray-500">{record.nim} • {record.kelas || '-'}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-4">
                      <StatusBadge status={record.status} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(record.timestamp), 'HH:mm')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {record.confidence ? `${record.confidence.toFixed(1)}%` : '-'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-gray-500">
              <Clock className="w-14 h-14 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Belum ada kehadiran hari ini</p>
              <p className="text-sm mt-1">Data akan muncul saat mahasiswa melakukan absensi</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Aksi Cepat</h2>
            <p className="text-sm text-gray-500 mt-0.5">Menu pintasan untuk admin</p>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/admin/students"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
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
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link 
              href="/admin/face-register"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
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
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link 
              href="/admin/reports"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <ClipboardList className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Laporan Absensi</p>
                  <p className="text-sm text-gray-500">Lihat statistik dan export data</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link 
              href="/admin/settings"
              className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Pengaturan</p>
                  <p className="text-sm text-gray-500">Konfigurasi sistem absensi</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
