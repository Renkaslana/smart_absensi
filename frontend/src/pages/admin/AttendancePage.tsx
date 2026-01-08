import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
import { adminService } from '../../services/adminService';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize date range based on filter
  useEffect(() => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    switch (dateFilter) {
      case 'today':
        setStartDate(formatDate(today));
        setEndDate(formatDate(today));
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        setStartDate(formatDate(weekAgo));
        setEndDate(formatDate(today));
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        setStartDate(formatDate(monthAgo));
        setEndDate(formatDate(today));
        break;
    }
  }, [dateFilter]);

  // Fetch attendance report from backend
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['attendance-report', startDate, endDate],
    queryFn: () => adminService.getAttendanceReport({
      start_date: startDate,
      end_date: endDate,
    }),
    enabled: !!startDate && !!endDate,
  });

  // Filter attendance list based on search and status
  const filteredAttendance = reportData?.student_breakdown?.filter((record: any) => {
    const matchesSearch = 
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.nim.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  // Calculate statistics
  const stats = {
    totalPresent: reportData?.overview?.by_status?.hadir || 0,
    totalLate: reportData?.overview?.by_status?.terlambat || 0,
    totalAbsent:
      (reportData?.overview?.total_students || 0) -
      (reportData?.overview?.unique_users || 0),
    avgConfidence: 92.9,
  };


  // Export to CSV
  const handleExport = async () => {
    try {
      const blob = await adminService.exportAttendanceCSV({
        start_date: startDate,
        end_date: endDate,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Laporan berhasil diexport!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal export laporan');
    }
  };

  // Weekly data for chart (would need to be processed from backend data)
  const weeklyData = [
    { day: 'Mon', present: 45, late: 3, absent: 2 },
    { day: 'Tue', present: 47, late: 2, absent: 1 },
    { day: 'Wed', present: 44, late: 4, absent: 2 },
    { day: 'Thu', present: 48, late: 1, absent: 1 },
    { day: 'Fri', present: 46, late: 3, absent: 1 },
  ];
    

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
                  onClick={handleExport}
                  disabled={isLoading || !reportData}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </motion.button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Users className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Belum ada data kehadiran</p>
                <p className="text-sm mt-1">Data akan muncul setelah siswa melakukan absensi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nama</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">NIM</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Total Hadir</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tingkat Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAttendance.map((record: any, index: number) => (
                    <motion.tr
                      key={record.nim}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{record.name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.nim}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{record.total_attendance}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  record.attendance_rate >= 80 ? 'bg-green-500' : record.attendance_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${record.attendance_rate}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            record.attendance_rate >= 80 ? 'text-green-600' : record.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {record.attendance_rate}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// Helper functions removed - no longer needed with backend data

export default AttendancePage;
