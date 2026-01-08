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

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['attendance-report', startDate, endDate],
    queryFn: () =>
      adminService.getAttendanceReport({
        start_date: startDate,
        end_date: endDate,
      }),
    enabled: !!startDate && !!endDate,
  });

  const filteredAttendance =
    reportData?.student_breakdown?.filter((record: any) =>
      searchQuery
        ? record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.nim.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    ) || [];

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
                Total: {reportData?.student_breakdown?.length || 0} • Menampilkan:{' '}
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
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Hadir
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Terlambat
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                      Tidak Hadir
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record: any) => (
                    <tr
                      key={record.user_id}
                      className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {record.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                        {record.nim}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.hadir > 0 ? (
                          <Badge variant="success" size="sm">
                            {record.hadir}
                          </Badge>
                        ) : (
                          <span className="text-sm text-neutral-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.terlambat > 0 ? (
                          <Badge variant="warning" size="sm">
                            {record.terlambat}
                          </Badge>
                        ) : (
                          <span className="text-sm text-neutral-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.tidak_hadir > 0 ? (
                          <Badge variant="danger" size="sm">
                            {record.tidak_hadir}
                          </Badge>
                        ) : (
                          <span className="text-sm text-neutral-400">0</span>
                        )}
                      </td>
                    </tr>
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

export default AttendancePage;
