import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  ClipboardCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  ScanFace,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';

const Dashboard: React.FC = () => {
  // 🌙 Dummy data - will be replaced with API calls
  const attendanceSummary = {
    total_hadir: 42,
    total_sakit: 2,
    total_izin: 1,
    total_alpa: 0,
    percentage: 93.3,
    status: 'good' as 'good' | 'warning' | 'alert',
  };

  const todaySchedule = [
    {
      id: 1,
      mata_kuliah: 'Algoritma & Pemrograman',
      waktu_mulai: '08:00',
      waktu_selesai: '10:00',
      ruangan: 'Lab Komputer 1',
      dosen: 'Dr. John Doe',
      status: 'upcoming',
    },
    {
      id: 2,
      mata_kuliah: 'Basis Data',
      waktu_mulai: '10:30',
      waktu_selesai: '12:30',
      ruangan: 'R. 301',
      dosen: 'Prof. Jane Smith',
      status: 'upcoming',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      tanggal: '2026-01-08',
      waktu: '08:05',
      mata_kuliah: 'Algoritma & Pemrograman',
      status: 'hadir' as const,
      method: 'face_recognition' as const,
      confidence: 0.95,
    },
    {
      id: 2,
      tanggal: '2026-01-07',
      waktu: '10:32',
      mata_kuliah: 'Basis Data',
      status: 'hadir' as const,
      method: 'face_recognition' as const,
      confidence: 0.92,
    },
    {
      id: 3,
      tanggal: '2026-01-06',
      waktu: '14:15',
      mata_kuliah: 'Struktur Data',
      status: 'hadir' as const,
      method: 'manual' as const,
      confidence: null,
    },
  ];

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge variant="success">Sangat Baik</Badge>;
      case 'warning':
        return <Badge variant="warning">Perlu Perhatian</Badge>;
      case 'alert':
        return <Badge variant="danger">Perlu Perbaikan</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hadir':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'sakit':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'izin':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'alpa':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Mahasiswa</h1>
        <p className="text-gray-600 mt-1">Selamat datang! Berikut ringkasan absensi Anda.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-teal-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tingkat Kehadiran</p>
                  <p className="text-3xl font-bold text-gray-900">{attendanceSummary.percentage}%</p>
                  {getAttendanceStatusBadge(attendanceSummary.status)}
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Hadir */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hadir</p>
                  <p className="text-3xl font-bold text-emerald-600">{attendanceSummary.total_hadir}</p>
                  <p className="text-xs text-gray-500 mt-1">Pertemuan</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sakit/Izin */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Sakit / Izin</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {attendanceSummary.total_sakit + attendanceSummary.total_izin}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pertemuan</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alpa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Alpa</p>
                  <p className="text-3xl font-bold text-red-600">{attendanceSummary.total_alpa}</p>
                  <p className="text-xs text-gray-500 mt-1">Pertemuan</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  <h2 className="text-xl font-bold text-gray-900">Jadwal Hari Ini</h2>
                </div>
                <Link to="/student/schedule" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1">
                  Lihat Semua
                  <ChevronRight size={16} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((kelas) => (
                    <div
                      key={kelas.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{kelas.mata_kuliah}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {kelas.waktu_mulai} - {kelas.waktu_selesai} • {kelas.ruangan}
                        </p>
                        <p className="text-sm text-gray-500">Dosen: {kelas.dosen}</p>
                      </div>
                      <Badge variant="info">Upcoming</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>Tidak ada jadwal hari ini</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link to="/student/face">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl transition-all hover:shadow-lg">
                    <ScanFace size={20} />
                    <span className="font-medium">Registrasi Wajah</span>
                  </button>
                </Link>

                <Link to="/student/attendance">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-teal-600 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                    <ClipboardCheck size={20} />
                    <span className="font-medium">Riwayat Absensi</span>
                  </button>
                </Link>

                <Link to="/public/absen">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                    <CheckCircle size={20} />
                    <span className="font-medium">Absen Sekarang</span>
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-teal-600" />
                <h2 className="text-xl font-bold text-gray-900">Aktivitas Terbaru</h2>
              </div>
              <Link to="/student/attendance" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1">
                Lihat Semua
                <ChevronRight size={16} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-teal-50 rounded-xl transition-colors"
                >
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{activity.mata_kuliah}</h3>
                    <p className="text-sm text-gray-600">
                      {activity.tanggal} • {activity.waktu}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        activity.status === 'hadir'
                          ? 'success'
                          : activity.status === 'sakit' || activity.status === 'izin'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </Badge>
                    {activity.method === 'face_recognition' && activity.confidence && (
                      <p className="text-xs text-gray-500 mt-1">
                        {(activity.confidence * 100).toFixed(0)}% confidence
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
