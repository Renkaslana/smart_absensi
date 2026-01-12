import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import {
  Calendar,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  AlertCircle,
} from 'lucide-react';


import { adminService } from '../../services/adminService';
import { ShellHeader } from '../../components/layouts/Shell';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MetricCard } from '../../components/ui/MetricCard';
import { Badge } from '../../components/ui/Feedback';
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton';

const AttendancePage = () => {
  const [dateFilter, setDateFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 🌙 Helper function to format date/time based on filter
  const formatDateTime = (dateStr: string, timeStr: string, filter: string) => {
    const date = new Date(dateStr);
    
    if (filter === 'today') {
      // Hari ini: tampilkan waktu saja (08:15)
      return timeStr;
    } else if (filter === 'week') {
      // Minggu: tampilkan hari dan waktu (Senin, 08:15)
      const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
      return `${dayName}, ${timeStr}`;
    } else {
      // 30 hari: tampilkan tanggal dan waktu (12 Jan, 08:15)
      const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `${formattedDate}, ${timeStr}`;
    }
  };

  // 🌙 Helper function to generate automatic keterangan based on time
  const getAutoKeterangan = (timeStr: string): string => {
    if (!timeStr || typeof timeStr !== 'string') {
      return '-';
    }
    
    const timeParts = timeStr.split(':');
    if (timeParts.length < 2) {
      return '-';
    }
    
    const [hours, minutes] = timeParts.map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return '-';
    }
    
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

  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ['attendance-report', startDate, endDate],
    queryFn: () =>
      adminService.getAttendanceReport({
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: !!startDate && !!endDate,
  });

  // 🌙 Fetch detailed attendance records
  const { data: attendanceRecords, isLoading: isLoadingRecords } = useQuery({
    queryKey: ['attendance-details', startDate, endDate],
    queryFn: () =>
      adminService.getAttendance({
        start_date: startDate,
        end_date: endDate,
        limit: 1000, // Get all records for the period
      }),
    enabled: !!startDate && !!endDate,
  });

  const isLoading = isLoadingReport || isLoadingRecords;

  const filteredAttendance =
    attendanceRecords?.items?.filter((record: any) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        record.user?.name?.toLowerCase().includes(query) ||
        record.user?.nim?.toLowerCase().includes(query)
      );
    }) || [];

  const totalPresent = reportData?.overview?.by_status?.hadir || 0;
  const totalLate = reportData?.overview?.by_status?.terlambat || 0;
  const totalStudents = reportData?.overview?.total_students || 0;
  const uniqueUsers = reportData?.overview?.unique_users || 0;
  const totalAbsent = totalStudents - uniqueUsers;
  const attendanceRate = totalStudents > 0 ? Math.round((uniqueUsers / totalStudents) * 100) : 0;

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

  return (
    <div className="space-y-6">
      <ShellHeader
        title="Laporan Kehadiran"
        description="Monitor dan analisis data kehadiran siswa"
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Download size={18} />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              title="Hadir"
              value={totalPresent}
              icon={<CheckCircle size={24} />}
              trend={attendanceRate > 85 ? 'up' : 'down'}
              color="success"
            />
            <MetricCard
              title="Terlambat"
              value={totalLate}
              icon={<Clock size={24} />}
              color="warning"
            />
            <MetricCard
              title="Tidak Hadir"
              value={totalAbsent}
              icon={<XCircle size={24} />}
              color="danger"
            />
            <MetricCard
              title="Tingkat Kehadiran"
              value={`${attendanceRate}%`}
              icon={<TrendingUp size={24} />}
              trend={attendanceRate > 85 ? 'up' : 'down'}
              color="accent"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Periode:
              </span>
            </div>

            <div className="flex gap-2">
              {[
                { value: 'today', label: 'Hari Ini' },
                { value: 'week', label: '7 Hari' },
                { value: 'month', label: '30 Hari' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setDateFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateFilter === filter.value
                      ? 'bg-accent-500 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="ml-auto relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                placeholder="Cari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Detail Kehadiran
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Total Record: {attendanceRecords?.total || 0} • Menampilkan:{' '}
                {filteredAttendance.length}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={8} columns={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Siswa
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      NIM
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Waktu Absen
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map((record: any) => {
                      const formattedDateTime = formatDateTime(record.date, record.time_in, dateFilter);
                      const autoKeterangan = getAutoKeterangan(record.time_in);
                      
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {record.user?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                            {record.user?.nim || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-neutral-400" />
                              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {formattedDateTime}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={record.confidence >= 0.8 ? 'success' : 'warning'} size="sm">
                              Face {record.confidence ? `${(record.confidence * 100).toFixed(0)}%` : 'Recognition'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                {autoKeterangan}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-neutral-500">
                          <AlertCircle className="w-12 h-12 text-neutral-400" />
                          <p>Tidak ada data kehadiran</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
