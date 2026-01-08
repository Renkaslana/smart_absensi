import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminService } from '../../services/adminService';

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch student details from backend
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => adminService.getUserById(Number(id)),
    enabled: !!id,
    onError: (error: any) => {
      toast.error('Gagal memuat data siswa');
      console.error('Load student error:', error);
    },
  });

  // Fetch attendance history
  const { data: attendanceData, isLoading: loadingHistory } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn: () => adminService.getUserAttendanceHistory(Number(id), { limit: 30 }),
    enabled: !!id,
  });

  const isLoading = loadingStudent || loadingHistory;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600 mb-4">Data siswa tidak ditemukan</p>
        <button
          onClick={() => navigate('/admin/students')}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Process attendance history for chart
  const monthlyData = [];
  if (attendanceData?.items) {
    // Group by month
    const monthGroups: Record<string, number> = {};
    attendanceData.items.forEach((att: any) => {
      const monthKey = new Date(att.date).toLocaleDateString('id-ID', { month: 'short' });
      monthGroups[monthKey] = (monthGroups[monthKey] || 0) + 1;
    });
    
    Object.entries(monthGroups).forEach(([month, count]) => {
      monthlyData.push({ month, attendance: count });
    });
  }

  // Recent attendance (last 7 days)
  const recentAttendance = attendanceData?.items?.slice(0, 7) || [];

  const monthlyTrend = [
    { month: 'Aug', present: 18, late: 1, absent: 1 },
    { month: 'Sep', present: 19, late: 0, absent: 1 },
    { month: 'Oct', present: 20, late: 1, absent: 0 },
    { month: 'Nov', present: 17, late: 2, absent: 1 },
    { month: 'Dec', present: 19, late: 1, absent: 0 },
    { month: 'Jan', present: 15, late: 2, absent: 1 },
  ];

  const attendanceRate = ((student.presentCount / student.totalAttendance) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -5 }}
        onClick={() => navigate('/admin/students')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Daftar Siswa
      </motion.button>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            </div>
          </div>
          <CardContent className="relative px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl border-4 border-white">
                  {student.name.charAt(0)}
                </div>
                {student.has_face && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="flex items-center justify-center gap-1 mt-3 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Face Registered
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h1>
                <p className="text-lg text-gray-600 mb-4">NIM: {student.nim}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{student.email || 'Belum diisi'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-semibold text-gray-900">{student.is_active ? 'Aktif' : 'Nonaktif'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Kelas</p>
                      <p className="text-sm font-semibold text-gray-900">{student.kelas || 'Belum diisi'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Face Images</p>
                      <p className="text-sm font-semibold text-gray-900">{student.encodings_count || 0} foto</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Streak</p>
                      <p className="text-sm font-semibold text-gray-900">{student.current_streak || 0} hari</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Total Hadir</p>
                  <p className="text-4xl font-bold">{student.total_attendance || 0}</p>
                  <p className="text-green-100 text-xs mt-2">{student.attendance_rate?.toFixed(1) || 0}% attendance rate</p>
                </div>
                <CheckCircle className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Streak</p>
                  <p className="text-4xl font-bold">{student.current_streak || 0}</p>
                  <p className="text-blue-100 text-xs mt-2">hari berturut-turut</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Face Images</p>
                  <p className="text-4xl font-bold">{student.encodings_count || 0}</p>
                  <p className="text-purple-100 text-xs mt-2">foto terdaftar</p>
                </div>
                <Camera className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-orange-100 text-sm mb-2">Status</p>
                  <p className="text-3xl font-bold">{student.is_active ? 'Aktif' : 'Nonaktif'}</p>
                  <p className="text-orange-100 text-xs mt-2">Account status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl">Tren Kehadiran</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {monthlyData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Area type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={3} fill="url(#colorPresent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>Belum ada data</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl">Riwayat Kehadiran Terkini</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {recentAttendance.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentAttendance.map((record: any, index: number) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          record.status === 'hadir' ? 'bg-green-100' : record.status === 'terlambat' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {record.status === 'hadir' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : record.status === 'terlambat' ? (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(record.date).toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.timestamp).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{record.confidence?.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500">confidence</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Calendar className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>Belum ada riwayat</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Face Images - Removed mockup, can be added later when images are accessible */}
    </motion.div>
  );
};

export default StudentDetailPage;
