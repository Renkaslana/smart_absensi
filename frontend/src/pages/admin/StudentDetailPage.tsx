import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
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
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock student data
  const student = {
    id: id || '1',
    name: 'Demo Student',
    nim: '23215030',
    email: 'demo@student.com',
    phone: '+62 812-3456-7890',
    birthDate: '2003-05-15',
    address: 'Jakarta Selatan, Indonesia',
    kelas: 'PCD-A',
    semester: '5',
    hasFace: true,
    faceImages: 3,
    totalAttendance: 45,
    presentCount: 42,
    lateCount: 2,
    absentCount: 1,
    avgConfidence: 94.5,
    lastAttendance: '2025-01-08 08:15'
  };

  const attendanceHistory = [
    { date: 'Jan 8', status: 'present', time: '08:15', confidence: 95.2 },
    { date: 'Jan 7', status: 'present', time: '08:10', confidence: 93.8 },
    { date: 'Jan 6', status: 'late', time: '08:35', confidence: 91.5 },
    { date: 'Jan 5', status: 'present', time: '08:12', confidence: 96.1 },
    { date: 'Jan 4', status: 'present', time: '08:08', confidence: 94.7 },
    { date: 'Jan 3', status: 'absent', time: '-', confidence: 0 },
    { date: 'Jan 2', status: 'present', time: '08:14', confidence: 92.3 },
  ];

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
                {student.hasFace && (
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
                      <p className="text-sm font-semibold text-gray-900">{student.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telepon</p>
                      <p className="text-sm font-semibold text-gray-900">{student.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tanggal Lahir</p>
                      <p className="text-sm font-semibold text-gray-900">{student.birthDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Kelas</p>
                      <p className="text-sm font-semibold text-gray-900">{student.kelas} - Semester {student.semester}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Alamat</p>
                      <p className="text-sm font-semibold text-gray-900">{student.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Face Images</p>
                      <p className="text-sm font-semibold text-gray-900">{student.faceImages} foto</p>
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
                  <p className="text-green-100 text-sm mb-1">Hadir</p>
                  <p className="text-4xl font-bold">{student.presentCount}</p>
                  <p className="text-green-100 text-xs mt-2">{attendanceRate}% attendance</p>
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
          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm mb-1">Terlambat</p>
                  <p className="text-4xl font-bold">{student.lateCount}</p>
                  <p className="text-yellow-100 text-xs mt-2">{((student.lateCount / student.totalAttendance) * 100).toFixed(1)}% of total</p>
                </div>
                <Clock className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">Tidak Hadir</p>
                  <p className="text-4xl font-bold">{student.absentCount}</p>
                  <p className="text-red-100 text-xs mt-2">{((student.absentCount / student.totalAttendance) * 100).toFixed(1)}% of total</p>
                </div>
                <XCircle className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Avg Confidence</p>
                  <p className="text-4xl font-bold">{student.avgConfidence}%</p>
                  <p className="text-blue-100 text-xs mt-2">Face recognition</p>
                </div>
                <TrendingUp className="w-12 h-12 opacity-80" />
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
              <CardTitle className="text-xl">Tren Kehadiran Bulanan</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
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
                    <Area type="monotone" dataKey="present" stroke="#10B981" strokeWidth={3} fill="url(#colorPresent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
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
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {attendanceHistory.map((record, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        record.status === 'present' ? 'bg-green-100' :
                        record.status === 'late' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        {record.status === 'present' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                         record.status === 'late' ? <Clock className="w-5 h-5 text-yellow-600" /> :
                         <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{record.date}</p>
                        <p className="text-xs text-gray-500">{record.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        record.status === 'present' ? 'text-green-600' :
                        record.status === 'late' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {record.status === 'present' ? 'Hadir' :
                         record.status === 'late' ? 'Terlambat' : 'Tidak Hadir'}
                      </p>
                      {record.confidence > 0 && (
                        <p className="text-xs text-gray-500">{record.confidence}% confidence</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Face Images */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl">Face Recognition Images</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((img) => (
                <div
                  key={img}
                  className="aspect-square rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300 hover:border-blue-500 transition-colors"
                >
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Face Image {img}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StudentDetailPage;
