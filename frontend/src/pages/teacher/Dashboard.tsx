import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  Clock,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Feedback';

const TeacherDashboard: React.FC = () => {
  // 🌙 Dummy data
  const stats = {
    total_classes: 4,
    total_students: 132,
    today_classes: 2,
    attendance_rate: 91.5,
  };

  const todayClasses = [
    {
      id: 1,
      kelas: 'XII IPA 1',
      mata_pelajaran: 'Matematika',
      waktu_mulai: '08:00',
      waktu_selesai: '09:30',
      ruangan: 'Kelas 12A',
      total_siswa: 32,
      hadir: 30,
      status: 'completed',
    },
    {
      id: 2,
      kelas: 'XI IPA 2',
      mata_pelajaran: 'Matematika',
      waktu_mulai: '10:00',
      waktu_selesai: '11:30',
      ruangan: 'Kelas 11B',
      total_siswa: 34,
      hadir: 0,
      status: 'upcoming',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      kelas: 'XII IPA 1',
      tanggal: '2026-01-08',
      waktu: '08:00',
      hadir: 30,
      sakit: 1,
      izin: 1,
      alpa: 0,
      total: 32,
    },
    {
      id: 2,
      kelas: 'X IPA 3',
      tanggal: '2026-01-07',
      waktu: '13:00',
      hadir: 28,
      sakit: 2,
      izin: 0,
      alpa: 1,
      total: 31,
    },
  ];

  const getClassStatusBadge = (status: string) => {
    if (status === 'completed') return <Badge variant="success">Selesai</Badge>;
    if (status === 'ongoing') return <Badge variant="info">Berlangsung</Badge>;
    return <Badge variant="warning">Akan Datang</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Guru</h1>
        <p className="text-gray-600 mt-1">Selamat datang kembali! Kelola kelas dan absensi Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-teal-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Kelas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total_classes}</p>
                  <p className="text-xs text-gray-500 mt-1">Kelas aktif</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Siswa</p>
                  <p className="text-3xl font-bold text-emerald-600">{stats.total_students}</p>
                  <p className="text-xs text-gray-500 mt-1">Semua kelas</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kelas Hari Ini</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.today_classes}</p>
                  <p className="text-xs text-gray-500 mt-1">Jadwal</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Rata-rata Kehadiran</p>
                  <p className="text-3xl font-bold text-teal-600">{stats.attendance_rate}%</p>
                  <p className="text-xs text-gray-500 mt-1">Semua kelas</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
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
                  <h2 className="text-xl font-bold text-gray-900">Kelas Hari Ini</h2>
                </div>
                <Link
                  to="/teacher/classes"
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
                >
                  Lihat Semua
                  <ChevronRight size={16} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayClasses.map((kelas) => (
                  <div
                    key={kelas.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 hover:bg-teal-50 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{kelas.mata_pelajaran}</h3>
                        {getClassStatusBadge(kelas.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {kelas.kelas} • {kelas.waktu_mulai} - {kelas.waktu_selesai} • {kelas.ruangan}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Siswa: {kelas.total_siswa}
                        </span>
                        {kelas.status === 'completed' && (
                          <span className="text-emerald-600 font-medium">
                            Hadir: {kelas.hadir}/{kelas.total_siswa}
                          </span>
                        )}
                      </div>
                    </div>
                    {kelas.status !== 'completed' && (
                      <Link to="/teacher/mark-attendance">
                        <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium">
                          Tandai Absensi
                        </button>
                      </Link>
                    )}
                  </div>
                ))}
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
                <Link to="/teacher/mark-attendance">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl transition-all hover:shadow-lg">
                    <ClipboardCheck size={20} />
                    <span className="font-medium">Tandai Absensi</span>
                  </button>
                </Link>

                <Link to="/teacher/classes">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-teal-600 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                    <Users size={20} />
                    <span className="font-medium">Kelola Kelas</span>
                  </button>
                </Link>

                <Link to="/teacher/reports">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                    <Award size={20} />
                    <span className="font-medium">Lihat Laporan</span>
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
                <h2 className="text-xl font-bold text-gray-900">Absensi Terbaru</h2>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-teal-50 rounded-xl transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{activity.kelas}</h3>
                    <p className="text-sm text-gray-600">
                      {activity.tanggal} • {activity.waktu}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-emerald-600">{activity.hadir}</p>
                      <p className="text-xs text-gray-500">Hadir</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-yellow-600">{activity.sakit}</p>
                      <p className="text-xs text-gray-500">Sakit</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{activity.izin}</p>
                      <p className="text-xs text-gray-500">Izin</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-red-600">{activity.alpa}</p>
                      <p className="text-xs text-gray-500">Alpa</p>
                    </div>
                  </div>
                  <Badge variant="success">
                    {Math.round((activity.hadir / activity.total) * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default TeacherDashboard;
