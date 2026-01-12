import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react';

import studentService from '../../services/studentService';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Feedback';
import { SkeletonTable } from '../../components/ui/Skeleton';

const AttendanceListPage = () => {
  const [dateFilter, setDateFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 🌙 Helper function to format date/time based on filter (matching admin pattern)
  const formatDateTime = (timestampStr: string, filter: string) => {
    const timestamp = new Date(timestampStr);
    const timeStr = timestamp.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    if (filter === 'today') {
      // Hari ini: tampilkan waktu saja (08:15)
      return timeStr;
    } else if (filter === 'week') {
      // Minggu: tampilkan hari dan waktu (Senin, 08:15)
      const dayName = timestamp.toLocaleDateString('id-ID', { weekday: 'long' });
      return `${dayName}, ${timeStr}`;
    } else {
      // 30 hari: tampilkan tanggal dan waktu (12 Jan, 08:15)
      const formattedDate = timestamp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `${formattedDate}, ${timeStr}`;
    }
  };

  // 🌙 Helper function to generate automatic keterangan based on time (matching admin pattern)
  const getAutoKeterangan = (timestampStr: string): string => {
    if (!timestampStr) {
      return '-';
    }
    
    const timestamp = new Date(timestampStr);
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Before 7:00
    if (totalMinutes < 7 * 60) {
      return '🌟 Siswa rajin dan baik!';
    }
    // Between 7:00 - 7:59
    else if (totalMinutes >= 7 * 60 && totalMinutes < 8 * 60) {
      return '⚠️ Hampir telat, hati-hati!';
    }
    // After 8:00
    else {
      return '❌ Terlambat! Tingkatkan disiplin!';
    }
  };

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

  // 🌙 Fetch student attendance history
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['student-attendance-list', startDate, endDate],
    queryFn: () =>
      studentService.getAttendanceHistory({
        date_start: startDate,
        date_end: endDate,
        page: 1,
        page_size: 1000,
      }),
    enabled: !!startDate && !!endDate,
  });

  const filteredAttendance =
    attendanceData?.data?.filter((record: any) => {
      // Filter by search query (status only since we don't have mata_pelajaran)
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return record.status?.toLowerCase().includes(query);
    }) || [];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir':
        return <Badge variant="success">Hadir</Badge>;
      case 'terlambat':
        return <Badge variant="warning">Terlambat</Badge>;
      case 'izin':
        return <Badge variant="info">Izin</Badge>;
      case 'sakit':
        return <Badge variant="warning">Sakit</Badge>;
      case 'alpa':
        return <Badge variant="danger">Alpa</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hadir':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'terlambat':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'izin':
      case 'sakit':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'alpa':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daftar Absensi</h1>
          <p className="text-gray-600 mt-1">Riwayat lengkap kehadiran Anda</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Periode
              </label>
              <div className="flex gap-2">
                <Button
                  variant={dateFilter === 'today' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('today')}
                >
                  Hari Ini
                </Button>
                <Button
                  variant={dateFilter === 'week' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('week')}
                >
                  7 Hari
                </Button>
                <Button
                  variant={dateFilter === 'month' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('month')}
                >
                  30 Hari
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Cari Mata Pelajaran
              </label>
              <input
                type="text"
                placeholder="Cari mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Riwayat Kehadiran</h2>
          <p className="text-sm text-gray-600 mt-1">
            Menampilkan {filteredAttendance.length} dari {attendanceData?.total || 0} record
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : filteredAttendance.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Tidak ada hasil untuk pencarian Anda'
                  : 'Belum ada catatan absensi untuk periode ini'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu Absen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keterangan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendance.map((record: any, index: number) => (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatDateTime(record.timestamp, dateFilter)}
                            </div>
                            {dateFilter !== 'today' && (
                              <div className="text-xs text-gray-500">{record.date}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          {getStatusBadge(record.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {getAutoKeterangan(record.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.confidence && (
                          <div className="text-sm text-gray-700">
                            {Math.round(record.confidence * 100)}% yakin
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceListPage;
