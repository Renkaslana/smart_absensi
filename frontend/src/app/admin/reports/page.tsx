'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileBarChart, 
  Calendar, 
  Download, 
  Filter,
  Loader2,
  CheckCircle,
  FileText,
  BarChart3,
  Users,
  AlertCircle
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

interface ReportOverview {
  total_students: number;
  total_absensi: number;
  today_count: number;
  attendance_rate_today: number;
  registered_faces: number;
  unique_users: number;
  by_status: {
    hadir?: number;
    terlambat?: number;
    izin?: number;
    sakit?: number;
    alpha?: number;
  };
  daily_summary: Array<{ date: string; count: number }>;
  weekly_summary: Array<{ week: string; count: number }>;
  by_kelas: Array<{ kelas: string; count: number }>;
}

interface StudentBreakdown {
  name: string;
  nim: string;
  total_attendance: number;
  attendance_rate: number;
}

interface ReportData {
  period: {
    from: string | null;
    to: string | null;
  };
  overview: ReportOverview;
  student_breakdown: StudentBreakdown[];
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get date range based on report type
  const getDateRange = () => {
    const today = new Date();
    let dateFrom: string;
    let dateTo: string = today.toISOString().split('T')[0];

    switch (reportType) {
      case 'daily':
        dateFrom = dateTo;
        break;
      case 'weekly':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        dateFrom = weekAgo.toISOString().split('T')[0];
        break;
      case 'monthly':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        dateFrom = monthAgo.toISOString().split('T')[0];
        break;
      case 'custom':
        dateFrom = dateRange.start;
        dateTo = dateRange.end;
        break;
      default:
        dateFrom = dateTo;
    }

    return { dateFrom, dateTo };
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { dateFrom, dateTo } = getDateRange();
      
      if (reportType === 'custom' && (!dateFrom || !dateTo)) {
        setError('Pilih tanggal mulai dan akhir untuk laporan kustom');
        setIsGenerating(false);
        return;
      }

      const response = await adminAPI.getReport({
        date_from: dateFrom,
        date_to: dateTo
      });

      setReportData(response.data);
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.detail || 'Gagal membuat laporan. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (format: 'csv' | 'pdf') => {
    if (!reportData) return;

    if (format === 'csv') {
      const headers = ['NIM', 'Nama', 'Total Kehadiran', 'Tingkat Kehadiran (%)'];
      const csvContent = [
        headers.join(','),
        ...reportData.student_breakdown.map((s) => 
          [s.nim, `"${s.name}"`, s.total_attendance, s.attendance_rate].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_absensi_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Get period label
  const getPeriodLabel = () => {
    if (!reportData) return '';
    if (reportData.period.from === reportData.period.to) {
      return reportData.period.from || 'Hari Ini';
    }
    return `${reportData.period.from || '-'} s/d ${reportData.period.to || '-'}`;
  };

  // Calculate attendance rate
  const getAttendanceRate = () => {
    if (!reportData || reportData.overview.total_students === 0) return 0;
    const totalHadir = (reportData.overview.by_status?.hadir || 0) + (reportData.overview.by_status?.terlambat || 0);
    return Math.round((totalHadir / reportData.overview.total_students) * 100);
  };

  // Chart data based on student breakdown
  const chartData = {
    labels: reportData?.student_breakdown.slice(0, 10).map((s) => s.name.split(' ')[0]) || [],
    datasets: [
      {
        label: 'Jumlah Kehadiran',
        data: reportData?.student_breakdown.slice(0, 10).map((s) => s.total_attendance) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-primary-900">Laporan Kehadiran</h1>
        <p className="text-neutral-600 mt-1">
          Generate dan download laporan kehadiran mahasiswa
        </p>
      </motion.div>

      {/* Report Generator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Buat Laporan</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Jenis Laporan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'daily', label: 'Harian' },
                { value: 'weekly', label: 'Mingguan' },
                { value: 'monthly', label: 'Bulanan' },
                { value: 'custom', label: 'Kustom' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value as ReportType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === type.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range (for custom) */}
          {reportType === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="input-field"
                />
              </div>
            </>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateReport}
          disabled={isGenerating}
          className="btn-primary flex items-center space-x-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memuat...</span>
            </>
          ) : (
            <>
              <FileBarChart className="w-5 h-5" />
              <span>Generate Laporan</span>
            </>
          )}
        </motion.button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </motion.div>

      {/* Report Result */}
      {reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card bg-primary-50 border border-primary-200">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-primary-600" />
                <div>
                  <p className="text-sm text-primary-600">Periode</p>
                  <p className="font-bold text-primary-900 text-sm">{getPeriodLabel()}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <p className="text-sm text-neutral-500">Total Mahasiswa</p>
              <p className="text-2xl font-bold text-primary-600">{reportData.overview.total_students}</p>
            </div>
            <div className="card">
              <p className="text-sm text-neutral-500">Total Absensi</p>
              <p className="text-2xl font-bold text-green-600">{reportData.overview.total_absensi}</p>
            </div>
            <div className="card">
              <p className="text-sm text-neutral-500">Kehadiran Hari Ini</p>
              <p className="text-2xl font-bold text-blue-600">{reportData.overview.today_count}</p>
            </div>
            <div className="card">
              <p className="text-sm text-neutral-500">Tingkat Kehadiran</p>
              <p className="text-2xl font-bold text-primary-600">{reportData.overview.attendance_rate_today}%</p>
            </div>
          </div>

          {/* Status Breakdown Cards */}
          {reportData.overview.by_status && Object.keys(reportData.overview.by_status).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-primary-900 mb-4">Breakdown Status Kehadiran</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-600">Hadir</p>
                  <p className="text-2xl font-bold text-green-700">{reportData.overview.by_status.hadir || 0}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-600">Terlambat</p>
                  <p className="text-2xl font-bold text-yellow-700">{reportData.overview.by_status.terlambat || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600">Izin</p>
                  <p className="text-2xl font-bold text-blue-700">{reportData.overview.by_status.izin || 0}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600">Sakit</p>
                  <p className="text-2xl font-bold text-purple-700">{reportData.overview.by_status.sakit || 0}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600">Alpha</p>
                  <p className="text-2xl font-bold text-red-700">{reportData.overview.by_status.alpha || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {reportData.student_breakdown.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-900">Top 10 Kehadiran Mahasiswa</h3>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => downloadReport('csv')}
                    className="btn-outline flex items-center space-x-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV</span>
                  </motion.button>
                </div>
              </div>
              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Detail Table - Student Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold text-primary-900 mb-4">
              Detail Kehadiran per Mahasiswa ({reportData.student_breakdown.length} mahasiswa)
            </h3>
            {reportData.student_breakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">No</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">NIM</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-700">Nama</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">Total Kehadiran</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-neutral-700">Tingkat (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.student_breakdown.map((student, index) => (
                      <tr key={student.nim} className="border-b border-neutral-100 last:border-0">
                        <td className="py-3 px-4 text-sm text-neutral-500">{index + 1}</td>
                        <td className="py-3 px-4 text-sm font-mono text-neutral-900">{student.nim}</td>
                        <td className="py-3 px-4 text-sm text-neutral-900">{student.name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            {student.total_attendance}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-sm font-medium ${
                            student.attendance_rate >= 80 ? 'text-green-600' :
                            student.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {student.attendance_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>Tidak ada data kehadiran untuk periode ini</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!reportData && !isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-12"
        >
          <BarChart3 className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
          <p className="text-neutral-500 font-medium">Belum ada laporan</p>
          <p className="text-neutral-400 text-sm mt-1">
            Pilih jenis laporan dan klik Generate untuk membuat laporan
          </p>
        </motion.div>
      )}

      {/* Quick Report Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card bg-primary-50 border border-primary-200"
      >
        <h3 className="font-semibold text-primary-900 mb-4">Template Laporan Cepat</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setReportType('daily');
              generateReport();
            }}
            className="p-4 bg-white rounded-lg border border-primary-200 hover:border-primary-400 transition-colors text-left"
          >
            <FileText className="w-8 h-8 text-primary-600 mb-2" />
            <p className="font-medium text-primary-900">Laporan Hari Ini</p>
            <p className="text-sm text-neutral-500">Rekap kehadiran hari ini</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setReportType('weekly');
              generateReport();
            }}
            className="p-4 bg-white rounded-lg border border-primary-200 hover:border-primary-400 transition-colors text-left"
          >
            <FileText className="w-8 h-8 text-primary-600 mb-2" />
            <p className="font-medium text-primary-900">Laporan Mingguan</p>
            <p className="text-sm text-neutral-500">Rekap kehadiran minggu ini</p>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setReportType('monthly');
              generateReport();
            }}
            className="p-4 bg-white rounded-lg border border-primary-200 hover:border-primary-400 transition-colors text-left"
          >
            <FileText className="w-8 h-8 text-primary-600 mb-2" />
            <p className="font-medium text-primary-900">Laporan Bulanan</p>
            <p className="text-sm text-neutral-500">Rekap kehadiran bulan ini</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
