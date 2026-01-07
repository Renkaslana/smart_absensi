'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  TrendingUp,
  Scan,
  ArrowRight,
  Camera,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { absensiAPI, faceAPI } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AbsensiRecord {
  id: number;
  tanggal: string;
  waktu: string;
  status: string;
  confidence: number;
  keterangan?: string;
}

interface Stats {
  total_hadir: number;
  total_terlambat: number;
  total_tidak_hadir: number;
  persentase_kehadiran: number;
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

export default function DashboardPage() {
  const { user, updateUser } = useAuthStore();
  const [hasFace, setHasFace] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats>({
    total_hadir: 0,
    total_terlambat: 0,
    total_tidak_hadir: 0,
    persentase_kehadiran: 0,
  });
  const [recentAbsensi, setRecentAbsensi] = useState<AbsensiRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    checkFaceStatus();
  }, []);

  const checkFaceStatus = async () => {
    try {
      const response = await faceAPI.getStatus();
      const hasRegisteredFace = response.data.has_face;
      setHasFace(hasRegisteredFace);
      
      // Update user store if different
      if (user?.has_face !== hasRegisteredFace) {
        updateUser({ has_face: hasRegisteredFace });
      }
    } catch (error) {
      console.error('Failed to check face status:', error);
      setHasFace(user?.has_face ?? false);
    }
  };

  const fetchData = async () => {
    try {
      const [historyRes, statsRes] = await Promise.all([
        absensiAPI.getHistory({ limit: 5 }),
        absensiAPI.getStats(),
      ]);
      
      console.log('📊 Dashboard - History response:', historyRes.data);
      console.log('📊 Dashboard - Stats response:', statsRes.data);
      
      // Backend returns PaginatedResponse with 'items' field
      const rawHistory = historyRes.data.items || historyRes.data.history || [];
      
      // Format history records
      const formattedHistory = rawHistory.map((record: any) => {
        let tanggal = record.tanggal;
        let waktu = record.waktu;
        
        // Parse from timestamp or date
        if (record.timestamp) {
          const date = new Date(record.timestamp);
          tanggal = date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          waktu = date.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit'
          });
        } else if (record.date) {
          const date = new Date(record.date);
          tanggal = date.toLocaleDateString('id-ID', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }
        
        return {
          ...record,
          tanggal: tanggal || '-',
          waktu: waktu || '-',
        };
      });
      
      setRecentAbsensi(formattedHistory);
      
      // Backend returns stats directly (not wrapped in .stats)
      // Map field names: total_attendance -> tidak ada field ini di frontend
      // attendance_rate -> persentase_kehadiran
      const statsData = statsRes.data;
      setStats({
        total_hadir: statsData.total_hadir || 0,
        total_terlambat: statsData.total_terlambat || 0,
        total_tidak_hadir: statsData.total_tidak_hadir || 0,
        persentase_kehadiran: statsData.attendance_rate || statsData.persentase_kehadiran || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Chart data
  const barChartData = {
    labels: ['Hadir', 'Terlambat', 'Tidak Hadir'],
    datasets: [
      {
        label: 'Statistik Kehadiran',
        data: [stats.total_hadir, stats.total_terlambat, stats.total_tidak_hadir],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const doughnutChartData = {
    labels: ['Hadir', 'Terlambat', 'Tidak Hadir'],
    datasets: [
      {
        data: [stats.total_hadir, stats.total_terlambat, stats.total_tidak_hadir],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: ['#fff', '#fff', '#fff'],
        borderWidth: 2,
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    cutout: '60%',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner text-primary-600" />
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Face Registration Alert - Show if user doesn't have face registered */}
      {hasFace === false && (
        <motion.div 
          variants={item} 
          className="bg-amber-50 border border-amber-200 rounded-xl p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Wajah Belum Terdaftar</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Anda perlu mendaftarkan wajah terlebih dahulu sebelum dapat melakukan absensi.
                </p>
              </div>
            </div>
            <Link href="/dashboard/face-register">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn bg-amber-600 text-white hover:bg-amber-700 flex items-center space-x-2 whitespace-nowrap"
              >
                <Camera className="w-4 h-4" />
                <span>Daftar Wajah Sekarang</span>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Welcome Section */}
      <motion.div variants={item} className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">
              {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-neutral-600 mt-1">
              Selamat datang di sistem absensi wajah. Jangan lupa absen hari ini!
            </p>
          </div>
          <Link href="/dashboard/absensi">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`btn-primary flex items-center space-x-2 ${hasFace === false ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={hasFace === false}
            >
              <Scan className="w-5 h-5" />
              <span>Absen Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hadir */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Total Hadir</p>
              <p className="text-3xl font-bold text-green-600">{stats.total_hadir}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Terlambat */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Terlambat</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.total_terlambat}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        {/* Total Tidak Hadir */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Tidak Hadir</p>
              <p className="text-3xl font-bold text-red-600">{stats.total_tidak_hadir}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>

        {/* Persentase Kehadiran */}
        <motion.div variants={item} className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Kehadiran</p>
              <p className="text-3xl font-bold text-primary-600">{stats.persentase_kehadiran.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.persentase_kehadiran}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full gradient-primary rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <motion.div variants={item} className="card">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Statistik Kehadiran</h3>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Doughnut Chart */}
        <motion.div variants={item} className="card">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Distribusi Kehadiran</h3>
          <div className="h-64">
            <Doughnut data={doughnutChartData} options={doughnutOptions} />
          </div>
        </motion.div>
      </div>

      {/* Recent Attendance */}
      <motion.div variants={item} className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary-900">Riwayat Absensi Terakhir</h3>
          <Link 
            href="/dashboard/history" 
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Lihat Semua
          </Link>
        </div>

        {recentAbsensi.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
            <p className="text-neutral-500">Belum ada riwayat absensi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Waktu</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-neutral-500">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recentAbsensi.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="py-3 px-4 text-sm text-neutral-900">{record.tanggal}</td>
                    <td className="py-3 px-4 text-sm text-neutral-600">{record.waktu}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'hadir'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'terlambat'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-600">
                      {record.confidence != null 
                        ? `${(record.confidence > 1 ? record.confidence : record.confidence * 100).toFixed(1)}%`
                        : '-'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
