import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AttendanceRecord {
  id: number;
  studentName: string;
  nim: string;
  date: string;
  time: string;
  status: 'present' | 'late' | 'absent';
  confidence: number;
}

const AttendancePage = () => {
  const [dateFilter, setDateFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const mockAttendance: AttendanceRecord[] = [
    { id: 1, studentName: 'Demo Student', nim: '23215030', date: '2025-01-08', time: '08:15', status: 'present', confidence: 95.2 },
    { id: 2, studentName: 'Ahmad Fauzi', nim: '23215031', date: '2025-01-08', time: '08:20', status: 'present', confidence: 92.8 },
    { id: 3, studentName: 'Siti Nurhaliza', nim: '23215032', date: '2025-01-08', time: '08:30', status: 'late', confidence: 89.5 },
    { id: 4, studentName: 'Budi Santoso', nim: '23215033', date: '2025-01-08', time: '08:10', status: 'present', confidence: 94.1 },
    { id: 5, studentName: 'Dewi Lestari', nim: '23215034', date: '2025-01-08', time: '-', status: 'absent', confidence: 0 },
  ];

  const weeklyData = [
    { day: 'Mon', present: 45, late: 3, absent: 2 },
    { day: 'Tue', present: 47, late: 2, absent: 1 },
    { day: 'Wed', present: 44, late: 4, absent: 2 },
    { day: 'Thu', present: 48, late: 1, absent: 1 },
    { day: 'Fri', present: 46, late: 3, absent: 1 },
  ];

  const stats = {
    totalPresent: 42,
    totalLate: 3,
    totalAbsent: 5,
    avgConfidence: 92.9
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: 'bg-green-100 text-green-700',
      late: 'bg-yellow-100 text-yellow-700',
      absent: 'bg-red-100 text-red-700'
    };
    return badges[status as keyof typeof badges] || badges.present;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'present') return <CheckCircle className="w-4 h-4" />;
    if (status === 'late') return <Clock className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Hadir</p>
                  <p className="text-4xl font-bold">{stats.totalPresent}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
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
          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm mb-1">Terlambat</p>
                  <p className="text-4xl font-bold">{stats.totalLate}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <Clock className="w-8 h-8" />
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
          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm mb-1">Tidak Hadir</p>
                  <p className="text-4xl font-bold">{stats.totalAbsent}</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <XCircle className="w-8 h-8" />
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
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Avg Confidence</p>
                  <p className="text-4xl font-bold">{stats.avgConfidence}%</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl">Tren Kehadiran Mingguan</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
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
                  <Area type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} fill="transparent" />
                  <Area type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters and Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl">Data Kehadiran</CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Date Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="today">Hari Ini</option>
                  <option value="week">Minggu Ini</option>
                  <option value="month">Bulan Ini</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  <option value="present">Hadir</option>
                  <option value="late">Terlambat</option>
                  <option value="absent">Tidak Hadir</option>
                </select>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama/NIM..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Export Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">NIM</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Waktu</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockAttendance.map((record, index) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{record.studentName}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.nim}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.time}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(record.status)}`}>
                          {getStatusIcon(record.status)}
                          {record.status === 'present' ? 'Hadir' : record.status === 'late' ? 'Terlambat' : 'Tidak Hadir'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${record.confidence > 90 ? 'bg-green-500' : record.confidence > 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${record.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-12 text-right">
                            {record.confidence > 0 ? `${record.confidence}%` : '-'}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan {mockAttendance.length} dari {mockAttendance.length} data
              </p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                  Previous
                </button>
                <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-semibold">
                  1
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AttendancePage;
